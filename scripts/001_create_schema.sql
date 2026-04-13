-- FRAGG.GG Database Schema
-- CS2 Community Platform

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  steam_id text unique,
  username text,
  avatar_url text,
  profile_url text,
  role text default 'player' check (role in ('player', 'pro', 'moderator', 'admin')),
  rank text,
  country text,
  bio text,
  created_at timestamptz default now(),
  last_seen timestamptz default now()
);

-- Badges table
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  icon_url text,
  color text
);

-- User badges junction table
create table if not exists public.user_badges (
  user_id uuid references public.users(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade,
  awarded_at timestamptz default now(),
  primary key (user_id, badge_id)
);

-- Matches table
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  map text not null,
  date_played timestamptz default now(),
  team1_score int not null default 0,
  team2_score int not null default 0,
  winner_team int check (winner_team in (1, 2)),
  match_type text default 'competitive' check (match_type in ('competitive', 'premier', 'wingman', 'scrimmage')),
  created_at timestamptz default now(),
  created_by uuid references public.users(id) on delete set null
);

-- Match players table
create table if not exists public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references public.matches(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  team int not null check (team in (1, 2)),
  kills int default 0,
  deaths int default 0,
  assists int default 0,
  headshot_percent float default 0,
  adr float default 0,
  rating float default 1.0,
  mvp_stars int default 0,
  unique(match_id, user_id)
);

-- Leaderboard cache table
create table if not exists public.leaderboard_cache (
  user_id uuid primary key references public.users(id) on delete cascade,
  total_kills int default 0,
  total_deaths int default 0,
  total_matches int default 0,
  total_wins int default 0,
  avg_rating float default 0,
  avg_adr float default 0,
  avg_hs_percent float default 0,
  kd_ratio float default 0,
  updated_at timestamptz default now()
);

-- Enable Row Level Security on all tables
alter table public.users enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.leaderboard_cache enable row level security;

-- RLS Policies for users
create policy "Users are viewable by everyone" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.users for insert with check (auth.uid() = id);

-- RLS Policies for badges (public read)
create policy "Badges are viewable by everyone" on public.badges for select using (true);
create policy "Only admins can manage badges" on public.badges for all using (
  exists (select 1 from public.users where id = auth.uid() and role = 'admin')
);

-- RLS Policies for user_badges
create policy "User badges are viewable by everyone" on public.user_badges for select using (true);
create policy "Only admins can award badges" on public.user_badges for insert with check (
  exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'moderator'))
);

-- RLS Policies for matches (public read)
create policy "Matches are viewable by everyone" on public.matches for select using (true);
create policy "Authenticated users can create matches" on public.matches for insert with check (auth.uid() is not null);
create policy "Only admins or creator can update matches" on public.matches for update using (
  auth.uid() = created_by or exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'moderator'))
);

-- RLS Policies for match_players
create policy "Match players are viewable by everyone" on public.match_players for select using (true);
create policy "Authenticated users can add match players" on public.match_players for insert with check (auth.uid() is not null);

-- RLS Policies for leaderboard_cache
create policy "Leaderboard is viewable by everyone" on public.leaderboard_cache for select using (true);

-- Trigger to auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', new.email),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Function to refresh leaderboard cache for a user
create or replace function public.refresh_user_leaderboard(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_stats record;
begin
  select
    coalesce(sum(mp.kills), 0) as total_kills,
    coalesce(sum(mp.deaths), 0) as total_deaths,
    count(distinct mp.match_id) as total_matches,
    count(distinct case when (mp.team = m.winner_team) then mp.match_id end) as total_wins,
    coalesce(avg(mp.rating), 0) as avg_rating,
    coalesce(avg(mp.adr), 0) as avg_adr,
    coalesce(avg(mp.headshot_percent), 0) as avg_hs_percent
  into v_stats
  from public.match_players mp
  join public.matches m on m.id = mp.match_id
  where mp.user_id = p_user_id;

  insert into public.leaderboard_cache (
    user_id, total_kills, total_deaths, total_matches, total_wins,
    avg_rating, avg_adr, avg_hs_percent, kd_ratio, updated_at
  ) values (
    p_user_id,
    v_stats.total_kills,
    v_stats.total_deaths,
    v_stats.total_matches,
    v_stats.total_wins,
    v_stats.avg_rating,
    v_stats.avg_adr,
    v_stats.avg_hs_percent,
    case when v_stats.total_deaths > 0 then v_stats.total_kills::float / v_stats.total_deaths else v_stats.total_kills end,
    now()
  )
  on conflict (user_id) do update set
    total_kills = excluded.total_kills,
    total_deaths = excluded.total_deaths,
    total_matches = excluded.total_matches,
    total_wins = excluded.total_wins,
    avg_rating = excluded.avg_rating,
    avg_adr = excluded.avg_adr,
    avg_hs_percent = excluded.avg_hs_percent,
    kd_ratio = excluded.kd_ratio,
    updated_at = excluded.updated_at;
end;
$$;

-- Insert default badges
insert into public.badges (name, description, icon_url, color) values
  ('Veteran', 'Played 100+ matches', null, '#f5a623'),
  ('Fragger', 'Average rating above 1.20', null, '#e53935'),
  ('IGL', 'In-Game Leader', null, '#2979ff'),
  ('Clutch King', 'Won 50+ clutch rounds', null, '#43a047'),
  ('Headshot Machine', 'Average HS% above 60%', null, '#9c27b0'),
  ('Entry Fragger', 'First blood specialist', null, '#ff5722')
on conflict (name) do nothing;

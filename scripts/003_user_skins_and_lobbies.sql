-- User Skins Loadout Table
-- Stores the skins each user has selected for their weapons

create table if not exists public.user_skins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  weapon_id text not null, -- e.g. "weapon_ak47", "weapon_awp"
  skin_id text not null, -- skin ID from the CS2 API
  skin_name text not null,
  skin_image text,
  wear text default 'Factory New',
  stattrak boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, weapon_id) -- One skin per weapon per user
);

-- Match Lobbies Table
-- For creating custom matches with privacy settings

create table if not exists public.match_lobbies (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references public.users(id) on delete cascade not null,
  name text not null,
  map_name text not null default 'dust2',
  visibility text not null default 'public' check (visibility in ('public', 'private', 'friends')),
  max_players int default 10 check (max_players in (2, 6, 10)),
  game_mode text default 'competitive' check (game_mode in ('competitive', 'wingman', 'deathmatch', 'casual')),
  password text, -- Optional password for private lobbies
  status text default 'waiting' check (status in ('waiting', 'in_progress', 'completed', 'cancelled')),
  server_ip text, -- CS2 server IP
  server_port int, -- CS2 server port
  created_at timestamptz default now(),
  started_at timestamptz,
  ended_at timestamptz
);

-- Lobby Players Junction Table
create table if not exists public.lobby_players (
  id uuid primary key default gen_random_uuid(),
  lobby_id uuid references public.match_lobbies(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  team int check (team in (1, 2)),
  is_ready boolean default false,
  joined_at timestamptz default now(),
  unique(lobby_id, user_id)
);

-- Friends Table (for friends-only lobbies)
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  friend_id uuid references public.users(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- Enable RLS
alter table public.user_skins enable row level security;
alter table public.match_lobbies enable row level security;
alter table public.lobby_players enable row level security;
alter table public.friends enable row level security;

-- RLS Policies for user_skins
create policy "User skins are viewable by everyone" on public.user_skins for select using (true);
create policy "Users can manage own skins" on public.user_skins for insert with check (auth.uid() = user_id);
create policy "Users can update own skins" on public.user_skins for update using (auth.uid() = user_id);
create policy "Users can delete own skins" on public.user_skins for delete using (auth.uid() = user_id);

-- RLS Policies for match_lobbies
create policy "Public lobbies are viewable by everyone" on public.match_lobbies for select using (
  visibility = 'public' 
  or host_id = auth.uid()
  or exists (select 1 from public.lobby_players where lobby_id = id and user_id = auth.uid())
  or (visibility = 'friends' and exists (
    select 1 from public.friends 
    where (user_id = auth.uid() and friend_id = host_id and status = 'accepted')
       or (friend_id = auth.uid() and user_id = host_id and status = 'accepted')
  ))
);
create policy "Authenticated users can create lobbies" on public.match_lobbies for insert with check (auth.uid() = host_id);
create policy "Hosts can update own lobbies" on public.match_lobbies for update using (auth.uid() = host_id);
create policy "Hosts can delete own lobbies" on public.match_lobbies for delete using (auth.uid() = host_id);

-- RLS Policies for lobby_players
create policy "Lobby players are viewable by lobby members" on public.lobby_players for select using (true);
create policy "Users can join lobbies" on public.lobby_players for insert with check (auth.uid() = user_id);
create policy "Users can leave lobbies" on public.lobby_players for delete using (auth.uid() = user_id);
create policy "Users can update own status" on public.lobby_players for update using (auth.uid() = user_id);

-- RLS Policies for friends
create policy "Users can view own friends" on public.friends for select using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users can send friend requests" on public.friends for insert with check (auth.uid() = user_id);
create policy "Users can manage friend requests" on public.friends for update using (auth.uid() = user_id or auth.uid() = friend_id);
create policy "Users can remove friends" on public.friends for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- Update users table to store Steam data
alter table public.users add column if not exists steam_id text unique;
alter table public.users add column if not exists profile_url text;

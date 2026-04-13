import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileHeader } from "@/components/profile-header"
import { ProfileStats } from "@/components/profile-stats"
import { ProfileMatches } from "@/components/profile-matches"
import { ProfileBadges } from "@/components/profile-badges"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: user } = await supabase.from("users").select("username").eq("id", id).single()
  
  return {
    title: user ? `${user.username} | FRAGG.GG` : "Profile | FRAGG.GG",
    description: user ? `View ${user.username}'s CS2 stats and match history` : "Player profile",
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !user) {
    notFound()
  }

  // Get user's recent matches
  const { data: matchPlayers } = await supabase
    .from("match_players")
    .select(`
      *,
      matches (*)
    `)
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(10)

  // Get user's badges
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select(`
      *,
      badges (*)
    `)
    .eq("user_id", id)

  // Get leaderboard rank
  const { data: allUsers } = await supabase
    .from("users")
    .select("id")
    .order("elo", { ascending: false })

  const rank = allUsers ? allUsers.findIndex((u) => u.id === id) + 1 : 0

  return (
    <div className="min-h-screen px-4 pb-16 pt-24">
      <div className="mx-auto max-w-6xl">
        <ProfileHeader user={user} rank={rank} />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <ProfileStats user={user} />
            <ProfileMatches matches={matchPlayers || []} />
          </div>
          <div>
            <ProfileBadges badges={userBadges || []} />
          </div>
        </div>
      </div>
    </div>
  )
}

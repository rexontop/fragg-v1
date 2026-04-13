import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { LobbyRoom } from "@/components/lobby-room"

export const metadata = {
  title: "Lobby | FRAGG.GG",
  description: "CS2 Match Lobby",
}

interface LobbyPageProps {
  params: Promise<{ id: string }>
}

export default async function LobbyPage({ params }: LobbyPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch lobby details
  const { data: lobby } = await supabase
    .from("match_lobbies")
    .select(`
      *,
      users!match_lobbies_host_id_fkey (id, username, avatar_url),
      lobby_players (
        *,
        users (id, username, avatar_url, rank_tier, elo)
      )
    `)
    .eq("id", id)
    .single()

  if (!lobby) {
    notFound()
  }

  // Check if user is in lobby
  const isInLobby = lobby.lobby_players.some((p: { user_id: string }) => p.user_id === user.id)
  
  if (!isInLobby && lobby.status !== "waiting") {
    redirect("/matches")
  }

  // Fetch user's skin loadout
  const { data: userSkins } = await supabase
    .from("user_skins")
    .select("*")
    .eq("user_id", user.id)

  const loadout: Record<string, { skin_id: string; skin_name: string; skin_image: string }> = {}
  userSkins?.forEach((skin) => {
    loadout[skin.weapon_id] = {
      skin_id: skin.skin_id,
      skin_name: skin.skin_name,
      skin_image: skin.skin_image,
    }
  })

  // Fetch all players' loadouts for the server
  const playerIds = lobby.lobby_players.map((p: { user_id: string }) => p.user_id)
  const { data: allPlayerSkins } = await supabase
    .from("user_skins")
    .select("*")
    .in("user_id", playerIds)

  const allLoadouts: Record<string, Record<string, { skin_id: string; skin_name: string; skin_image: string }>> = {}
  allPlayerSkins?.forEach((skin) => {
    if (!allLoadouts[skin.user_id]) {
      allLoadouts[skin.user_id] = {}
    }
    allLoadouts[skin.user_id][skin.weapon_id] = {
      skin_id: skin.skin_id,
      skin_name: skin.skin_name,
      skin_image: skin.skin_image,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 pb-16 pt-24">
        <div className="mx-auto max-w-4xl">
          <LobbyRoom 
            lobby={lobby} 
            currentUserId={user.id}
            userLoadout={loadout}
            allLoadouts={allLoadouts}
          />
        </div>
      </main>
    </div>
  )
}

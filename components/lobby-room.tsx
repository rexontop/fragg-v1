"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { 
  Users, 
  MapPin, 
  Copy, 
  Check, 
  Play, 
  LogOut,
  Crown,
  Loader2,
  Globe,
  Lock,
  UserCheck,
  Crosshair
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

interface User {
  id: string
  username: string
  avatar_url: string | null
  rank_tier?: string
  elo?: number
}

interface LobbyPlayer {
  id: string
  user_id: string
  team: number | null
  users: User
}

interface Lobby {
  id: string
  name: string
  host_id: string
  map_name: string
  max_players: number
  visibility: "public" | "private" | "friends"
  status: "waiting" | "in_progress" | "completed"
  created_at: string
  users: User
  lobby_players: LobbyPlayer[]
}

interface LobbyRoomProps {
  lobby: Lobby
  currentUserId: string
  userLoadout: Record<string, { skin_id: string; skin_name: string; skin_image: string }>
  allLoadouts: Record<string, Record<string, { skin_id: string; skin_name: string; skin_image: string }>>
}

const visibilityIcons = {
  public: Globe,
  private: Lock,
  friends: UserCheck,
}

export function LobbyRoom({ lobby: initialLobby, currentUserId, userLoadout, allLoadouts }: LobbyRoomProps) {
  const router = useRouter()
  const [lobby, setLobby] = useState(initialLobby)
  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  const isHost = currentUserId === lobby.host_id
  const VisibilityIcon = visibilityIcons[lobby.visibility]
  const team1Players = lobby.lobby_players.filter(p => p.team === 1)
  const team2Players = lobby.lobby_players.filter(p => p.team === 2)
  const unassignedPlayers = lobby.lobby_players.filter(p => p.team === null)

  // Real-time subscription for lobby updates
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`lobby-${lobby.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lobby_players",
          filter: `lobby_id=eq.${lobby.id}`,
        },
        async () => {
          // Refetch lobby data
          const { data } = await supabase
            .from("match_lobbies")
            .select(`
              *,
              users!match_lobbies_host_id_fkey (id, username, avatar_url),
              lobby_players (
                *,
                users (id, username, avatar_url, rank_tier, elo)
              )
            `)
            .eq("id", lobby.id)
            .single()
          
          if (data) {
            setLobby(data)
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "match_lobbies",
          filter: `id=eq.${lobby.id}`,
        },
        async (payload) => {
          if (payload.new.status === "in_progress") {
            // Redirect to match
            router.push(`/matches/${lobby.id}`)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [lobby.id, router])

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/matches/lobby/${lobby.id}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTeamChange = async (playerId: string, team: number | null) => {
    const supabase = createClient()
    await supabase
      .from("lobby_players")
      .update({ team })
      .eq("id", playerId)
  }

  const handleStartMatch = async () => {
    setIsStarting(true)
    
    const supabase = createClient()
    
    // Update lobby status
    await supabase
      .from("match_lobbies")
      .update({ status: "in_progress" })
      .eq("id", lobby.id)

    // Create the match record
    const { data: match } = await supabase
      .from("matches")
      .insert({
        map_name: lobby.map_name,
        team1_score: 0,
        team2_score: 0,
        played_at: new Date().toISOString(),
        verified: false,
      })
      .select()
      .single()

    if (match) {
      // Add all players to match with their skins
      const matchPlayers = lobby.lobby_players.map(player => ({
        match_id: match.id,
        user_id: player.user_id,
        team: player.team || 1,
        kills: 0,
        deaths: 0,
        assists: 0,
        skin_loadout: allLoadouts[player.user_id] || {},
      }))

      await supabase
        .from("match_players")
        .insert(matchPlayers)

      router.push(`/matches/${match.id}`)
    }
    
    setIsStarting(false)
  }

  const handleLeaveLobby = async () => {
    setIsLeaving(true)
    
    const supabase = createClient()
    
    // Remove player from lobby
    await supabase
      .from("lobby_players")
      .delete()
      .eq("lobby_id", lobby.id)
      .eq("user_id", currentUserId)

    // If host leaves, delete the lobby or transfer ownership
    if (isHost) {
      const remainingPlayers = lobby.lobby_players.filter(p => p.user_id !== currentUserId)
      if (remainingPlayers.length > 0) {
        // Transfer to first remaining player
        await supabase
          .from("match_lobbies")
          .update({ host_id: remainingPlayers[0].user_id })
          .eq("id", lobby.id)
      } else {
        // Delete empty lobby
        await supabase
          .from("match_lobbies")
          .delete()
          .eq("id", lobby.id)
      }
    }

    router.push("/matches")
  }

  const PlayerCard = ({ player, showTeamControls = false }: { player: LobbyPlayer; showTeamControls?: boolean }) => {
    const playerLoadout = allLoadouts[player.user_id] || {}
    const loadoutCount = Object.keys(playerLoadout).length
    const isCurrentUser = player.user_id === currentUserId

    return (
      <div className={`flex items-center justify-between rounded-lg border p-3 ${
        isCurrentUser ? "border-primary/50 bg-primary/5" : "border-border bg-card"
      }`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              {player.users?.avatar_url ? (
                <img 
                  src={player.users.avatar_url} 
                  alt="" 
                  className="h-full w-full rounded-full object-cover" 
                />
              ) : (
                <span className="font-medium">
                  {player.users?.username?.charAt(0).toUpperCase() || "?"}
                </span>
              )}
            </div>
            {player.user_id === lobby.host_id && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="w-3 h-3 text-yellow-900" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium">
              {player.users?.username || "Unknown"}
              {isCurrentUser && <span className="text-xs text-muted-foreground ml-1">(You)</span>}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {player.users?.rank_tier && (
                <span className="capitalize">{player.users.rank_tier}</span>
              )}
              {loadoutCount > 0 && (
                <span className="flex items-center gap-1">
                  <Crosshair className="w-3 h-3" />
                  {loadoutCount} skins
                </span>
              )}
            </div>
          </div>
        </div>
        
        {showTeamControls && isHost && player.user_id !== currentUserId && (
          <div className="flex gap-1">
            <button
              onClick={() => handleTeamChange(player.id, 1)}
              className={`px-2 py-1 text-xs rounded ${
                player.team === 1 ? "bg-blue-500 text-white" : "bg-muted"
              }`}
            >
              CT
            </button>
            <button
              onClick={() => handleTeamChange(player.id, 2)}
              className={`px-2 py-1 text-xs rounded ${
                player.team === 2 ? "bg-orange-500 text-white" : "bg-muted"
              }`}
            >
              T
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <VisibilityIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground capitalize">{lobby.visibility} Lobby</span>
          </div>
          <h1 className="text-2xl font-bold">{lobby.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="capitalize">{lobby.map_name.replace("_", " ")}</span>
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {lobby.lobby_players.length}/{lobby.max_players} players
            </span>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyInviteLink}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Invite
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleLeaveLobby} disabled={isLeaving}>
            {isLeaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Leave
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Teams */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team 1 (CT) */}
        <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
          <h3 className="mb-4 font-semibold text-blue-500">Counter-Terrorists</h3>
          <div className="space-y-2">
            {team1Players.map(player => (
              <PlayerCard key={player.id} player={player} showTeamControls />
            ))}
            {team1Players.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No players</p>
            )}
          </div>
        </div>

        {/* Team 2 (T) */}
        <div className="rounded-xl border border-orange-500/30 bg-orange-500/5 p-4">
          <h3 className="mb-4 font-semibold text-orange-500">Terrorists</h3>
          <div className="space-y-2">
            {team2Players.map(player => (
              <PlayerCard key={player.id} player={player} showTeamControls />
            ))}
            {team2Players.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No players</p>
            )}
          </div>
        </div>
      </div>

      {/* Unassigned Players */}
      {unassignedPlayers.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 font-semibold">Waiting to Join Team</h3>
          <div className="space-y-2">
            {unassignedPlayers.map(player => (
              <PlayerCard key={player.id} player={player} showTeamControls />
            ))}
          </div>
        </div>
      )}

      {/* Your Loadout */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Crosshair className="h-5 w-5 text-primary" />
            <div>
              <h3 className="font-semibold">Your Skin Loadout</h3>
              <p className="text-sm text-muted-foreground">
                {Object.keys(userLoadout).length > 0 
                  ? "These skins will be applied when the match starts"
                  : "No skins equipped - using default weapons"
                }
              </p>
            </div>
          </div>
          <Link href="/skins" className="text-sm text-primary hover:underline">
            Edit
          </Link>
        </div>
        
        {Object.keys(userLoadout).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {Object.entries(userLoadout).slice(0, 8).map(([weaponId, skin]) => (
              <div 
                key={weaponId}
                className="flex-shrink-0 w-24 h-16 bg-muted rounded-lg overflow-hidden relative group"
                title={skin.skin_name}
              >
                <Image
                  src={skin.skin_image}
                  alt={skin.skin_name}
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start Match Button (Host Only) */}
      {isHost && (
        <Button
          size="lg"
          className="w-full"
          onClick={handleStartMatch}
          disabled={isStarting || lobby.lobby_players.length < 2}
        >
          {isStarting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Starting Match...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Match
            </>
          )}
        </Button>
      )}

      {!isHost && (
        <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
          <p className="text-muted-foreground">Waiting for host to start the match...</p>
        </div>
      )}
    </div>
  )
}

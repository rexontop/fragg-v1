"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { 
  Users, 
  Lock, 
  Globe, 
  UserCheck, 
  MapPin, 
  Clock, 
  Loader2,
  ChevronRight 
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  username: string
  avatar_url: string | null
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

interface LobbyListProps {
  lobbies: Lobby[]
  currentUserId?: string
}

const visibilityIcons = {
  public: Globe,
  private: Lock,
  friends: UserCheck,
}

const visibilityLabels = {
  public: "Public",
  private: "Private",
  friends: "Friends Only",
}

export function LobbyList({ lobbies, currentUserId }: LobbyListProps) {
  const router = useRouter()
  const [joiningLobby, setJoiningLobby] = useState<string | null>(null)

  const handleJoinLobby = async (lobby: Lobby) => {
    if (!currentUserId) {
      router.push("/auth/login")
      return
    }

    setJoiningLobby(lobby.id)
    
    const supabase = createClient()
    
    // Check if already in lobby
    const isInLobby = lobby.lobby_players.some(p => p.user_id === currentUserId)
    
    if (!isInLobby) {
      // Join the lobby
      const { error } = await supabase
        .from("lobby_players")
        .insert({
          lobby_id: lobby.id,
          user_id: currentUserId,
        })

      if (error) {
        console.error("Failed to join lobby:", error)
        setJoiningLobby(null)
        return
      }
    }

    // Navigate to lobby
    router.push(`/matches/lobby/${lobby.id}`)
    setJoiningLobby(null)
  }

  if (lobbies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card py-12 text-center">
        <Users className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No Active Lobbies</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Be the first to create a lobby!
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lobbies.map((lobby) => {
        const VisibilityIcon = visibilityIcons[lobby.visibility]
        const playerCount = lobby.lobby_players.length
        const isFull = playerCount >= lobby.max_players
        const isHost = currentUserId === lobby.host_id
        const isInLobby = lobby.lobby_players.some(p => p.user_id === currentUserId)

        return (
          <div
            key={lobby.id}
            className="group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-lg"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <VisibilityIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold truncate max-w-[150px]">{lobby.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {visibilityLabels[lobby.visibility]}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold ${isFull ? "text-destructive" : "text-primary"}`}>
                  {playerCount}/{lobby.max_players}
                </div>
                <p className="text-xs text-muted-foreground">Players</p>
              </div>
            </div>

            {/* Info */}
            <div className="p-4">
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                  <MapPin className="h-3 w-3" />
                  <span className="capitalize">{lobby.map_name.replace("_", " ")}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(lobby.created_at), { addSuffix: true })}
                </div>
              </div>

              {/* Host */}
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {lobby.users?.avatar_url ? (
                    <img 
                      src={lobby.users.avatar_url} 
                      alt="" 
                      className="h-full w-full rounded-full object-cover" 
                    />
                  ) : (
                    lobby.users?.username?.charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  Hosted by <span className="text-foreground">{lobby.users?.username || "Unknown"}</span>
                </span>
              </div>

              {/* Players Preview */}
              {playerCount > 0 && (
                <div className="mb-4 flex -space-x-2">
                  {lobby.lobby_players.slice(0, 5).map((player) => (
                    <div
                      key={player.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium"
                      title={player.users?.username}
                    >
                      {player.users?.avatar_url ? (
                        <img 
                          src={player.users.avatar_url} 
                          alt="" 
                          className="h-full w-full rounded-full object-cover" 
                        />
                      ) : (
                        player.users?.username?.charAt(0).toUpperCase() || "?"
                      )}
                    </div>
                  ))}
                  {playerCount > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
                      +{playerCount - 5}
                    </div>
                  )}
                </div>
              )}

              {/* Join Button */}
              <button
                onClick={() => handleJoinLobby(lobby)}
                disabled={joiningLobby === lobby.id || (isFull && !isInLobby)}
                className={`w-full flex items-center justify-center gap-2 rounded-lg py-2.5 font-medium transition-colors ${
                  isInLobby || isHost
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : isFull
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                {joiningLobby === lobby.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : isInLobby || isHost ? (
                  <>
                    Enter Lobby
                    <ChevronRight className="h-4 w-4" />
                  </>
                ) : isFull ? (
                  "Lobby Full"
                ) : (
                  "Join Lobby"
                )}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

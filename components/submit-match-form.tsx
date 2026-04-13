"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, X, Users, Target, MapPin, AlertCircle, CheckCircle } from "lucide-react"

interface User {
  id: string
  username: string
  avatar_url: string | null
  rank_tier: string
}

interface PlayerStats {
  userId: string
  kills: number
  deaths: number
  assists: number
}

const maps = [
  "dust2",
  "mirage",
  "inferno",
  "nuke",
  "overpass",
  "ancient",
  "anubis",
  "vertigo",
]

export function SubmitMatchForm({
  users,
  currentUserId,
}: {
  users: User[]
  currentUserId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [mapName, setMapName] = useState("")
  const [team1Score, setTeam1Score] = useState("")
  const [team2Score, setTeam2Score] = useState("")
  const [team1Players, setTeam1Players] = useState<PlayerStats[]>([
    { userId: currentUserId, kills: 0, deaths: 0, assists: 0 },
  ])
  const [team2Players, setTeam2Players] = useState<PlayerStats[]>([])

  const addPlayer = (team: 1 | 2) => {
    const newPlayer = { userId: "", kills: 0, deaths: 0, assists: 0 }
    if (team === 1) {
      setTeam1Players([...team1Players, newPlayer])
    } else {
      setTeam2Players([...team2Players, newPlayer])
    }
  }

  const removePlayer = (team: 1 | 2, index: number) => {
    if (team === 1) {
      setTeam1Players(team1Players.filter((_, i) => i !== index))
    } else {
      setTeam2Players(team2Players.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (
    team: 1 | 2,
    index: number,
    field: keyof PlayerStats,
    value: string | number
  ) => {
    const players = team === 1 ? [...team1Players] : [...team2Players]
    players[index] = { ...players[index], [field]: value }
    if (team === 1) {
      setTeam1Players(players)
    } else {
      setTeam2Players(players)
    }
  }

  const getAvailableUsers = (team: 1 | 2, currentIndex: number) => {
    const selectedIds = [
      ...team1Players.map((p) => p.userId),
      ...team2Players.map((p) => p.userId),
    ].filter((id, idx) => {
      if (team === 1) {
        return idx !== currentIndex
      } else {
        return idx !== currentIndex + team1Players.length
      }
    })
    return users.filter((u) => !selectedIds.includes(u.id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!mapName) {
      setError("Please select a map")
      setLoading(false)
      return
    }

    if (!team1Score || !team2Score) {
      setError("Please enter both team scores")
      setLoading(false)
      return
    }

    if (team1Players.length === 0 || team2Players.length === 0) {
      setError("Each team must have at least one player")
      setLoading(false)
      return
    }

    if (team1Players.some((p) => !p.userId) || team2Players.some((p) => !p.userId)) {
      setError("Please select a player for each slot")
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Create match
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .insert({
        map_name: mapName,
        team1_score: parseInt(team1Score),
        team2_score: parseInt(team2Score),
        played_at: new Date().toISOString(),
        submitted_by: currentUserId,
      })
      .select()
      .single()

    if (matchError) {
      setError(matchError.message)
      setLoading(false)
      return
    }

    // Calculate ELO changes (simplified)
    const team1Won = parseInt(team1Score) > parseInt(team2Score)
    const baseEloChange = 25

    // Create match players
    const matchPlayers = [
      ...team1Players.map((p) => ({
        match_id: match.id,
        user_id: p.userId,
        team: 1,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        elo_change: team1Won ? baseEloChange : -baseEloChange,
      })),
      ...team2Players.map((p) => ({
        match_id: match.id,
        user_id: p.userId,
        team: 2,
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        elo_change: team1Won ? -baseEloChange : baseEloChange,
      })),
    ]

    const { error: playersError } = await supabase
      .from("match_players")
      .insert(matchPlayers)

    if (playersError) {
      setError(playersError.message)
      setLoading(false)
      return
    }

    // Update user stats (ELO and match counts)
    for (const player of matchPlayers) {
      const isWin = (player.team === 1 && team1Won) || (player.team === 2 && !team1Won)
      
      await supabase.rpc("update_user_stats", {
        p_user_id: player.user_id,
        p_kills: player.kills,
        p_deaths: player.deaths,
        p_assists: player.assists,
        p_elo_change: player.elo_change,
        p_is_win: isWin,
      })
    }

    setSuccess(true)
    setTimeout(() => {
      router.push(`/matches/${match.id}`)
    }, 1500)
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 py-16 text-center">
        <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold">Match Submitted!</h3>
        <p className="text-muted-foreground">Redirecting to match details...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Map Selection */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Map</h2>
        </div>
        <Select value={mapName} onValueChange={setMapName}>
          <SelectTrigger>
            <SelectValue placeholder="Select map" />
          </SelectTrigger>
          <SelectContent>
            {maps.map((map) => (
              <SelectItem key={map} value={map} className="capitalize">
                {map.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Score */}
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Final Score</h2>
        </div>
        <div className="flex items-center justify-center gap-4">
          <div className="text-center">
            <Label htmlFor="team1Score" className="text-sm text-muted-foreground">
              Team 1
            </Label>
            <Input
              id="team1Score"
              type="number"
              min="0"
              max="16"
              value={team1Score}
              onChange={(e) => setTeam1Score(e.target.value)}
              className="mt-1 w-20 text-center text-2xl font-bold"
            />
          </div>
          <span className="text-2xl text-muted-foreground">-</span>
          <div className="text-center">
            <Label htmlFor="team2Score" className="text-sm text-muted-foreground">
              Team 2
            </Label>
            <Input
              id="team2Score"
              type="number"
              min="0"
              max="16"
              value={team2Score}
              onChange={(e) => setTeam2Score(e.target.value)}
              className="mt-1 w-20 text-center text-2xl font-bold"
            />
          </div>
        </div>
      </div>

      {/* Team 1 */}
      <TeamSection
        teamNumber={1}
        players={team1Players}
        users={users}
        currentUserId={currentUserId}
        getAvailableUsers={(idx) => getAvailableUsers(1, idx)}
        onAddPlayer={() => addPlayer(1)}
        onRemovePlayer={(idx) => removePlayer(1, idx)}
        onUpdatePlayer={(idx, field, value) => updatePlayer(1, idx, field, value)}
      />

      {/* Team 2 */}
      <TeamSection
        teamNumber={2}
        players={team2Players}
        users={users}
        currentUserId={currentUserId}
        getAvailableUsers={(idx) => getAvailableUsers(2, idx)}
        onAddPlayer={() => addPlayer(2)}
        onRemovePlayer={(idx) => removePlayer(2, idx)}
        onUpdatePlayer={(idx, field, value) => updatePlayer(2, idx, field, value)}
      />

      {/* Submit */}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Match"
        )}
      </Button>
    </form>
  )
}

function TeamSection({
  teamNumber,
  players,
  users,
  currentUserId,
  getAvailableUsers,
  onAddPlayer,
  onRemovePlayer,
  onUpdatePlayer,
}: {
  teamNumber: 1 | 2
  players: PlayerStats[]
  users: User[]
  currentUserId: string
  getAvailableUsers: (index: number) => User[]
  onAddPlayer: () => void
  onRemovePlayer: (index: number) => void
  onUpdatePlayer: (index: number, field: keyof PlayerStats, value: string | number) => void
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Team {teamNumber}</h2>
        </div>
        {players.length < 5 && (
          <Button type="button" variant="outline" size="sm" onClick={onAddPlayer}>
            <Plus className="mr-1 h-4 w-4" />
            Add Player
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {players.map((player, index) => {
          const available = getAvailableUsers(index)
          const isCurrentUser = player.userId === currentUserId

          return (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-lg border border-border/30 bg-muted/30 p-4 sm:flex-row sm:items-center"
            >
              {/* Player Select */}
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Player</Label>
                <Select
                  value={player.userId}
                  onValueChange={(value) => onUpdatePlayer(index, "userId", value)}
                  disabled={isCurrentUser}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {isCurrentUser && (
                      <SelectItem value={currentUserId}>
                        {users.find((u) => u.id === currentUserId)?.username} (You)
                      </SelectItem>
                    )}
                    {available.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Stats */}
              <div className="flex gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">K</Label>
                  <Input
                    type="number"
                    min="0"
                    value={player.kills}
                    onChange={(e) => onUpdatePlayer(index, "kills", parseInt(e.target.value) || 0)}
                    className="mt-1 w-16 text-center"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">D</Label>
                  <Input
                    type="number"
                    min="0"
                    value={player.deaths}
                    onChange={(e) => onUpdatePlayer(index, "deaths", parseInt(e.target.value) || 0)}
                    className="mt-1 w-16 text-center"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">A</Label>
                  <Input
                    type="number"
                    min="0"
                    value={player.assists}
                    onChange={(e) => onUpdatePlayer(index, "assists", parseInt(e.target.value) || 0)}
                    className="mt-1 w-16 text-center"
                  />
                </div>
              </div>

              {/* Remove Button */}
              {!isCurrentUser && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemovePlayer(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )
        })}

        {players.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No players added yet</p>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onAddPlayer}>
              <Plus className="mr-1 h-4 w-4" />
              Add First Player
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Users, Clock, ChevronRight, Swords } from "lucide-react"

interface User {
  id: string
  username: string
  avatar_url: string | null
  rank_tier: string
}

interface MatchPlayer {
  id: string
  user_id: string
  team: number
  kills: number
  deaths: number
  assists: number
  users: User
}

interface Match {
  id: string
  map_name: string
  team1_score: number
  team2_score: number
  played_at: string
  verified: boolean
  match_players: MatchPlayer[]
}

const mapImages: Record<string, string> = {
  dust2: "/maps/dust2.jpg",
  mirage: "/maps/mirage.jpg",
  inferno: "/maps/inferno.jpg",
  nuke: "/maps/nuke.jpg",
  overpass: "/maps/overpass.jpg",
  ancient: "/maps/ancient.jpg",
  anubis: "/maps/anubis.jpg",
  vertigo: "/maps/vertigo.jpg",
}

export function MatchesList({ matches }: { matches: Match[] }) {
  const [search, setSearch] = useState("")
  const [mapFilter, setMapFilter] = useState<string | null>(null)

  const maps = [...new Set(matches.map((m) => m.map_name))]

  const filtered = matches.filter((m) => {
    const matchesSearch = search === "" || 
      m.map_name.toLowerCase().includes(search.toLowerCase()) ||
      m.match_players.some((mp) => 
        mp.users?.username?.toLowerCase().includes(search.toLowerCase())
      )
    const matchesMap = !mapFilter || m.map_name === mapFilter
    return matchesSearch && matchesMap
  })

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card py-16 text-center">
        <Swords className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-semibold">No Matches Yet</h3>
        <p className="mt-1 text-muted-foreground">
          Be the first to submit a match!
        </p>
        <Button className="mt-4" asChild>
          <Link href="/submit">Submit Match</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by map or player..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mapFilter === null ? "secondary" : "outline"}
            size="sm"
            onClick={() => setMapFilter(null)}
          >
            All Maps
          </Button>
          {maps.slice(0, 5).map((map) => (
            <Button
              key={map}
              variant={mapFilter === map ? "secondary" : "outline"}
              size="sm"
              onClick={() => setMapFilter(map)}
              className="capitalize"
            >
              {map.replace("_", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Match Cards */}
      <div className="grid gap-4">
        {filtered.map((match) => {
          const team1Players = match.match_players.filter((mp) => mp.team === 1)
          const team2Players = match.match_players.filter((mp) => mp.team === 2)
          const team1Won = match.team1_score > match.team2_score
          const isDraw = match.team1_score === match.team2_score

          return (
            <Link
              key={match.id}
              href={`/matches/${match.id}`}
              className="group relative overflow-hidden rounded-xl border border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-lg"
            >
              {/* Map background accent */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-gradient-to-r from-card via-transparent to-card" />
              </div>

              <div className="relative flex flex-col p-4 sm:flex-row sm:items-center sm:p-6">
                {/* Map Info */}
                <div className="mb-4 flex items-center gap-4 sm:mb-0 sm:w-48">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold capitalize">{match.map_name.replace("_", " ")}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(match.played_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="mb-4 flex flex-1 items-center justify-center gap-4 sm:mb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {team1Players.slice(0, 3).map((mp) => (
                        <div
                          key={mp.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium"
                          title={mp.users?.username}
                        >
                          {mp.users?.avatar_url ? (
                            <img src={mp.users.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            mp.users?.username?.charAt(0).toUpperCase() || "?"
                          )}
                        </div>
                      ))}
                      {team1Players.length > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
                          +{team1Players.length - 3}
                        </div>
                      )}
                    </div>
                    <span className={`text-2xl font-bold ${team1Won ? "text-green-500" : isDraw ? "text-yellow-500" : "text-muted-foreground"}`}>
                      {match.team1_score}
                    </span>
                  </div>

                  <span className="text-lg text-muted-foreground">vs</span>

                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${!team1Won && !isDraw ? "text-green-500" : isDraw ? "text-yellow-500" : "text-muted-foreground"}`}>
                      {match.team2_score}
                    </span>
                    <div className="flex -space-x-2">
                      {team2Players.slice(0, 3).map((mp) => (
                        <div
                          key={mp.id}
                          className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium"
                          title={mp.users?.username}
                        >
                          {mp.users?.avatar_url ? (
                            <img src={mp.users.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            mp.users?.username?.charAt(0).toUpperCase() || "?"
                          )}
                        </div>
                      ))}
                      {team2Players.length > 3 && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-card bg-muted text-xs font-medium">
                          +{team2Players.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-end">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border/50 bg-card py-16 text-center">
          <Search className="mb-4 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No matches found</p>
          <p className="text-sm text-muted-foreground">Try a different search or filter</p>
        </div>
      )}
    </div>
  )
}

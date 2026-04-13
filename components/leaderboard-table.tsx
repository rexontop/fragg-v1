"use client"

import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronUp, ChevronDown, Trophy, Target, Skull, Crosshair } from "lucide-react"

interface Player {
  id: string
  username: string
  avatar_url: string | null
  elo: number
  rank_tier: string
  total_kills: number
  total_deaths: number
  total_assists: number
  headshots: number
  matches_played: number
  wins: number
  created_at: string
}

type SortField = "elo" | "kd" | "matches_played" | "winrate" | "headshot_pct"
type SortDirection = "asc" | "desc"

export function LeaderboardTable({ players }: { players: Player[] }) {
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("elo")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "desc" ? "asc" : "desc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const filteredAndSorted = players
    .filter((p) => p.username.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let aVal: number
      let bVal: number

      switch (sortField) {
        case "elo":
          aVal = a.elo
          bVal = b.elo
          break
        case "kd":
          aVal = a.total_deaths > 0 ? a.total_kills / a.total_deaths : a.total_kills
          bVal = b.total_deaths > 0 ? b.total_kills / b.total_deaths : b.total_kills
          break
        case "matches_played":
          aVal = a.matches_played
          bVal = b.matches_played
          break
        case "winrate":
          aVal = a.matches_played > 0 ? a.wins / a.matches_played : 0
          bVal = b.matches_played > 0 ? b.wins / b.matches_played : 0
          break
        case "headshot_pct":
          aVal = a.total_kills > 0 ? a.headshots / a.total_kills : 0
          bVal = b.total_kills > 0 ? b.headshots / b.total_kills : 0
          break
        default:
          return 0
      }

      return sortDirection === "desc" ? bVal - aVal : aVal - bVal
    })

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
    >
      {label}
      {sortField === field && (
        sortDirection === "desc" ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />
      )}
    </button>
  )

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-yellow-500"
    if (rank === 2) return "text-zinc-400"
    if (rank === 3) return "text-orange-600"
    return "text-muted-foreground"
  }

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      unranked: "bg-zinc-500/20 text-zinc-400",
      bronze: "bg-orange-900/20 text-orange-400",
      silver: "bg-zinc-400/20 text-zinc-300",
      gold: "bg-yellow-500/20 text-yellow-500",
      platinum: "bg-cyan-500/20 text-cyan-400",
      diamond: "bg-blue-500/20 text-blue-400",
      master: "bg-purple-500/20 text-purple-400",
      grandmaster: "bg-red-500/20 text-red-400",
    }
    return colors[tier] || colors.unranked
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      {/* Search */}
      <div className="border-b border-border/50 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50 text-left text-sm">
              <th className="px-4 py-3 font-medium text-muted-foreground">#</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Player</th>
              <th className="px-4 py-3">
                <SortButton field="elo" label="ELO" />
              </th>
              <th className="hidden px-4 py-3 sm:table-cell">
                <SortButton field="kd" label="K/D" />
              </th>
              <th className="hidden px-4 py-3 md:table-cell">
                <SortButton field="headshot_pct" label="HS%" />
              </th>
              <th className="hidden px-4 py-3 lg:table-cell">
                <SortButton field="matches_played" label="Matches" />
              </th>
              <th className="px-4 py-3">
                <SortButton field="winrate" label="Win%" />
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map((player, index) => {
              const kd = player.total_deaths > 0
                ? (player.total_kills / player.total_deaths).toFixed(2)
                : player.total_kills.toFixed(2)
              const winRate = player.matches_played > 0
                ? ((player.wins / player.matches_played) * 100).toFixed(1)
                : "0.0"
              const hsPercent = player.total_kills > 0
                ? ((player.headshots / player.total_kills) * 100).toFixed(1)
                : "0.0"
              const rank = index + 1

              return (
                <tr
                  key={player.id}
                  className="border-b border-border/30 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <span className={`font-bold ${getRankColor(rank)}`}>
                      {rank <= 3 ? <Trophy className="h-4 w-4 inline" /> : rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/profile/${player.id}`}
                      className="flex items-center gap-3 hover:text-primary"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                        {player.avatar_url ? (
                          <img
                            src={player.avatar_url}
                            alt={player.username}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          player.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{player.username}</p>
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium capitalize ${getTierColor(player.rank_tier)}`}>
                          {player.rank_tier}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-primary">{player.elo}</span>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className={Number(kd) >= 1 ? "text-green-500" : "text-red-500"}>
                        {kd}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <Crosshair className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{hsPercent}%</span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span className="text-muted-foreground">{player.matches_played}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={Number(winRate) >= 50 ? "text-green-500" : "text-muted-foreground"}>
                      {winRate}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredAndSorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Skull className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No players found</p>
          <p className="text-sm text-muted-foreground">Try a different search term</p>
        </div>
      )}
    </div>
  )
}

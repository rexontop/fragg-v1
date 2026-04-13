"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Swords, Trophy, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Match {
  id: string
  map_name: string
  team1_score: number
  team2_score: number
  played_at: string
}

interface MatchPlayer {
  id: string
  team: number
  kills: number
  deaths: number
  assists: number
  elo_change: number
  matches: Match
}

export function ProfileMatches({ matches }: { matches: MatchPlayer[] }) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Recent Matches</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Swords className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No matches yet</p>
          <p className="text-sm text-muted-foreground">
            Start playing to see your match history
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Matches</h2>
        <Button variant="ghost" size="sm" className="gap-1" asChild>
          <Link href="/matches">
            View All <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="space-y-3">
        {matches.map((mp) => {
          const match = mp.matches
          const playerTeamScore = mp.team === 1 ? match.team1_score : match.team2_score
          const opponentScore = mp.team === 1 ? match.team2_score : match.team1_score
          const isWin = playerTeamScore > opponentScore
          const isDraw = playerTeamScore === opponentScore
          const kd = mp.deaths > 0
            ? (mp.kills / mp.deaths).toFixed(2)
            : mp.kills.toFixed(2)

          return (
            <Link
              key={mp.id}
              href={`/matches/${match.id}`}
              className={`flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                isWin
                  ? "border-green-500/30 bg-green-500/5"
                  : isDraw
                  ? "border-yellow-500/30 bg-yellow-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  isWin ? "bg-green-500/20 text-green-500" : isDraw ? "bg-yellow-500/20 text-yellow-500" : "bg-red-500/20 text-red-500"
                }`}>
                  {isWin ? <Trophy className="h-5 w-5" /> : isDraw ? <Swords className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium capitalize">{match.map_name.replace("_", " ")}</span>
                    <span className={`text-sm font-bold ${
                      isWin ? "text-green-500" : isDraw ? "text-yellow-500" : "text-red-500"
                    }`}>
                      {playerTeamScore} - {opponentScore}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(match.played_at), { addSuffix: true })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm">
                <div className="hidden text-center sm:block">
                  <p className="font-medium">{mp.kills}/{mp.deaths}/{mp.assists}</p>
                  <p className="text-xs text-muted-foreground">K/D/A</p>
                </div>
                <div className="text-center">
                  <p className={`font-bold ${Number(kd) >= 1 ? "text-green-500" : "text-red-500"}`}>
                    {kd}
                  </p>
                  <p className="text-xs text-muted-foreground">K/D</p>
                </div>
                <div className="text-center">
                  <p className={`font-bold ${mp.elo_change >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {mp.elo_change >= 0 ? "+" : ""}{mp.elo_change}
                  </p>
                  <p className="text-xs text-muted-foreground">ELO</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

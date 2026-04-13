"use client"

import { Trophy, Calendar, TrendingUp, Shield } from "lucide-react"

interface User {
  id: string
  username: string
  avatar_url: string | null
  elo: number
  rank_tier: string
  matches_played: number
  wins: number
  created_at: string
}

const tierColors: Record<string, { bg: string; text: string; border: string }> = {
  unranked: { bg: "bg-zinc-500/20", text: "text-zinc-400", border: "border-zinc-500/30" },
  bronze: { bg: "bg-orange-900/20", text: "text-orange-400", border: "border-orange-600/30" },
  silver: { bg: "bg-zinc-400/20", text: "text-zinc-300", border: "border-zinc-400/30" },
  gold: { bg: "bg-yellow-500/20", text: "text-yellow-500", border: "border-yellow-500/30" },
  platinum: { bg: "bg-cyan-500/20", text: "text-cyan-400", border: "border-cyan-500/30" },
  diamond: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  master: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  grandmaster: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
}

export function ProfileHeader({ user, rank }: { user: User; rank: number }) {
  const tierStyle = tierColors[user.rank_tier] || tierColors.unranked
  const winRate = user.matches_played > 0
    ? ((user.wins / user.matches_played) * 100).toFixed(1)
    : "0.0"
  const joinDate = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${tierStyle.border} ${tierStyle.bg} p-6 sm:p-8`}>
      {/* Background decorations */}
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />
      
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Avatar & Name */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className={`flex h-20 w-20 items-center justify-center rounded-2xl border-2 ${tierStyle.border} ${tierStyle.bg} text-3xl font-bold sm:h-24 sm:w-24`}>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.username}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <span className={tierStyle.text}>
                {user.username.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">{user.username}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-medium capitalize ${tierStyle.bg} ${tierStyle.text}`}>
                <Shield className="h-4 w-4" />
                {user.rank_tier}
              </span>
              {rank > 0 && rank <= 100 && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  <Trophy className="h-4 w-4" />
                  Rank #{rank}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Stats */}
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{user.elo}</p>
            <p className="text-sm text-muted-foreground">ELO Rating</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">{user.matches_played}</p>
            <p className="text-sm text-muted-foreground">Matches</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-bold ${Number(winRate) >= 50 ? "text-green-500" : "text-red-500"}`}>
              {winRate}%
            </p>
            <p className="text-sm text-muted-foreground">Win Rate</p>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="relative mt-6 flex items-center gap-4 border-t border-border/30 pt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          Joined {joinDate}
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4" />
          {user.wins} wins
        </div>
      </div>
    </div>
  )
}

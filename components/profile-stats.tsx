"use client"

import { Target, Skull, Users, Crosshair, Flame, Award } from "lucide-react"

interface User {
  total_kills: number
  total_deaths: number
  total_assists: number
  headshots: number
  matches_played: number
  wins: number
}

export function ProfileStats({ user }: { user: User }) {
  const kd = user.total_deaths > 0
    ? (user.total_kills / user.total_deaths).toFixed(2)
    : user.total_kills.toFixed(2)
  const hsPercent = user.total_kills > 0
    ? ((user.headshots / user.total_kills) * 100).toFixed(1)
    : "0.0"
  const kda = user.total_deaths > 0
    ? ((user.total_kills + user.total_assists) / user.total_deaths).toFixed(2)
    : (user.total_kills + user.total_assists).toFixed(2)
  const avgKills = user.matches_played > 0
    ? (user.total_kills / user.matches_played).toFixed(1)
    : "0.0"

  const stats = [
    {
      icon: Target,
      label: "Total Kills",
      value: user.total_kills.toLocaleString(),
      color: "text-green-500",
    },
    {
      icon: Skull,
      label: "Total Deaths",
      value: user.total_deaths.toLocaleString(),
      color: "text-red-500",
    },
    {
      icon: Users,
      label: "Total Assists",
      value: user.total_assists.toLocaleString(),
      color: "text-blue-500",
    },
    {
      icon: Crosshair,
      label: "Headshots",
      value: user.headshots.toLocaleString(),
      color: "text-yellow-500",
    },
    {
      icon: Flame,
      label: "K/D Ratio",
      value: kd,
      color: Number(kd) >= 1 ? "text-green-500" : "text-red-500",
    },
    {
      icon: Award,
      label: "KDA",
      value: kda,
      color: "text-primary",
    },
  ]

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">Performance Stats</h2>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="rounded-lg border border-border/30 bg-muted/30 p-4"
            >
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
                <span className="text-sm">{stat.label}</span>
              </div>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          )
        })}
      </div>

      {/* Additional Stats Bar */}
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/30 pt-4 sm:grid-cols-4">
        <div>
          <p className="text-sm text-muted-foreground">HS%</p>
          <p className="text-lg font-semibold">{hsPercent}%</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Avg Kills/Match</p>
          <p className="text-lg font-semibold">{avgKills}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Wins</p>
          <p className="text-lg font-semibold text-green-500">{user.wins}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Losses</p>
          <p className="text-lg font-semibold text-red-500">
            {user.matches_played - user.wins}
          </p>
        </div>
      </div>
    </div>
  )
}

import { createClient } from "@/lib/supabase/server"
import { LeaderboardTable } from "@/components/leaderboard-table"
import { Navbar } from "@/components/navbar"
import { Trophy, Medal, TrendingUp } from "lucide-react"

export const metadata = {
  title: "Leaderboard | FRAGG.GG",
  description: "CS2 competitive rankings and ELO leaderboard",
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  
  const { data: players } = await supabase
    .from("users")
    .select("*")
    .order("elo", { ascending: false })
    .limit(100)

  const topPlayers = players || []

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-4 pb-16 pt-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
            <Trophy className="h-4 w-4" />
            Season 4 Rankings
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Global Leaderboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            Top 100 players ranked by ELO rating
          </p>
        </div>

        {/* Top 3 Cards */}
        {topPlayers.length >= 3 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {[1, 0, 2].map((index) => {
              const player = topPlayers[index]
              if (!player) return null
              const rank = index === 1 ? 1 : index === 0 ? 2 : 3
              const colors = {
                1: "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30",
                2: "from-zinc-400/20 to-zinc-500/5 border-zinc-400/30",
                3: "from-orange-600/20 to-orange-700/5 border-orange-600/30",
              }
              const medalColors = {
                1: "text-yellow-500",
                2: "text-zinc-400",
                3: "text-orange-600",
              }
              return (
                <div
                  key={player.id}
                  className={`relative overflow-hidden rounded-xl border bg-gradient-to-b p-6 ${colors[rank as keyof typeof colors]} ${rank === 1 ? "sm:order-first sm:-mt-4" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <Medal className={`mb-2 h-8 w-8 ${medalColors[rank as keyof typeof medalColors]}`} />
                      <p className="text-sm text-muted-foreground">Rank #{rank}</p>
                      <h3 className="text-xl font-bold">{player.username}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">{player.elo}</p>
                      <p className="text-xs text-muted-foreground">ELO</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">K/D </span>
                      <span className="font-medium">
                        {player.total_deaths > 0
                          ? (player.total_kills / player.total_deaths).toFixed(2)
                          : player.total_kills.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Matches </span>
                      <span className="font-medium">{player.matches_played}</span>
                    </div>
                    <div className="flex items-center gap-1 text-green-500">
                      <TrendingUp className="h-3 w-3" />
                      <span className="font-medium">
                        {player.matches_played > 0
                          ? ((player.wins / player.matches_played) * 100).toFixed(0)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Full Table */}
        <LeaderboardTable players={topPlayers} />
      </div>
      </div>
    </div>
  )
}

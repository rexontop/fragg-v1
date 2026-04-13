import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { MapPin, Calendar, Clock, Trophy, Target, Skull, Users, Shield, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: match } = await supabase.from("matches").select("map_name, team1_score, team2_score").eq("id", id).single()
  
  return {
    title: match ? `${match.map_name} ${match.team1_score}-${match.team2_score} | FRAGG.GG` : "Match | FRAGG.GG",
  }
}

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: match, error } = await supabase
    .from("matches")
    .select(`
      *,
      match_players (
        *,
        users (id, username, avatar_url, rank_tier, elo)
      )
    `)
    .eq("id", id)
    .single()

  if (error || !match) {
    notFound()
  }

  const team1Players = match.match_players
    .filter((mp: { team: number }) => mp.team === 1)
    .sort((a: { kills: number }, b: { kills: number }) => b.kills - a.kills)
  const team2Players = match.match_players
    .filter((mp: { team: number }) => mp.team === 2)
    .sort((a: { kills: number }, b: { kills: number }) => b.kills - a.kills)
  const team1Won = match.team1_score > match.team2_score
  const isDraw = match.team1_score === match.team2_score

  const getTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      unranked: "text-zinc-400",
      bronze: "text-orange-400",
      silver: "text-zinc-300",
      gold: "text-yellow-500",
      platinum: "text-cyan-400",
      diamond: "text-blue-400",
      master: "text-purple-400",
      grandmaster: "text-red-400",
    }
    return colors[tier] || colors.unranked
  }

  return (
    <div className="min-h-screen px-4 pb-16 pt-24">
      <div className="mx-auto max-w-5xl">
        {/* Back Button */}
        <Button variant="ghost" size="sm" className="mb-6 gap-2" asChild>
          <Link href="/matches">
            <ChevronLeft className="h-4 w-4" />
            Back to Matches
          </Link>
        </Button>

        {/* Match Header */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-border/50 bg-card">
          <div className="relative p-6 sm:p-8">
            {/* Background accent */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

            <div className="relative">
              {/* Map & Time */}
              <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium capitalize">{match.map_name.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(match.played_at), "MMMM d, yyyy")}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {format(new Date(match.played_at), "h:mm a")}
                </div>
                {match.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">
                    <Shield className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>

              {/* Score Display */}
              <div className="flex items-center justify-center gap-6 sm:gap-12">
                <div className="text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    {team1Won && <Trophy className="h-5 w-5 text-yellow-500" />}
                    <span className="font-medium text-muted-foreground">Team 1</span>
                  </div>
                  <span className={`text-5xl font-bold sm:text-6xl ${team1Won ? "text-green-500" : isDraw ? "text-yellow-500" : "text-muted-foreground"}`}>
                    {match.team1_score}
                  </span>
                </div>

                <div className="text-2xl font-medium text-muted-foreground">vs</div>

                <div className="text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <span className="font-medium text-muted-foreground">Team 2</span>
                    {!team1Won && !isDraw && <Trophy className="h-5 w-5 text-yellow-500" />}
                  </div>
                  <span className={`text-5xl font-bold sm:text-6xl ${!team1Won && !isDraw ? "text-green-500" : isDraw ? "text-yellow-500" : "text-muted-foreground"}`}>
                    {match.team2_score}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Teams */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Team 1 */}
          <div className={`rounded-xl border p-6 ${team1Won ? "border-green-500/30 bg-green-500/5" : "border-border/50 bg-card"}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {team1Won && <Trophy className="h-5 w-5 text-yellow-500" />}
                Team 1
                {team1Won && <span className="text-sm font-normal text-green-500">Winner</span>}
              </h2>
              <span className="text-sm text-muted-foreground">{team1Players.length} players</span>
            </div>

            <div className="space-y-3">
              {team1Players.map((mp: any) => (
                <PlayerRow key={mp.id} player={mp} getTierColor={getTierColor} />
              ))}
            </div>
          </div>

          {/* Team 2 */}
          <div className={`rounded-xl border p-6 ${!team1Won && !isDraw ? "border-green-500/30 bg-green-500/5" : "border-border/50 bg-card"}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                {!team1Won && !isDraw && <Trophy className="h-5 w-5 text-yellow-500" />}
                Team 2
                {!team1Won && !isDraw && <span className="text-sm font-normal text-green-500">Winner</span>}
              </h2>
              <span className="text-sm text-muted-foreground">{team2Players.length} players</span>
            </div>

            <div className="space-y-3">
              {team2Players.map((mp: any) => (
                <PlayerRow key={mp.id} player={mp} getTierColor={getTierColor} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlayerRow({ player, getTierColor }: { player: any; getTierColor: (tier: string) => string }) {
  const kd = player.deaths > 0
    ? (player.kills / player.deaths).toFixed(2)
    : player.kills.toFixed(2)

  return (
    <Link
      href={`/profile/${player.users?.id}`}
      className="flex items-center justify-between rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
          {player.users?.avatar_url ? (
            <img src={player.users.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            player.users?.username?.charAt(0).toUpperCase() || "?"
          )}
        </div>
        <div>
          <p className="font-medium">{player.users?.username || "Unknown"}</p>
          <p className={`text-xs font-medium capitalize ${getTierColor(player.users?.rank_tier || "unranked")}`}>
            {player.users?.rank_tier || "unranked"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="flex items-center gap-1 text-green-500">
              <Target className="h-3.5 w-3.5" />
              <span className="font-medium">{player.kills}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-red-500">
              <Skull className="h-3.5 w-3.5" />
              <span className="font-medium">{player.deaths}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="flex items-center gap-1 text-blue-500">
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium">{player.assists}</span>
            </div>
          </div>
        </div>
        <div className="w-16 text-right">
          <span className={`font-bold ${Number(kd) >= 1 ? "text-green-500" : "text-red-500"}`}>
            {kd} K/D
          </span>
        </div>
        <div className="w-16 text-right">
          <span className={`font-bold ${player.elo_change >= 0 ? "text-green-500" : "text-red-500"}`}>
            {player.elo_change >= 0 ? "+" : ""}{player.elo_change}
          </span>
        </div>
      </div>
    </Link>
  )
}

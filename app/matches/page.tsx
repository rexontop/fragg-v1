import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { MatchesList } from "@/components/matches-list"
import { LobbyList } from "@/components/lobby-list"
import { Swords, Users } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Matches | FRAGG.GG",
  description: "Browse recent CS2 matches and create custom lobbies",
}

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch recent matches
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      *,
      match_players (
        *,
        users (id, username, avatar_url, rank_tier)
      )
    `)
    .order("played_at", { ascending: false })
    .limit(20)

  // Fetch active lobbies
  const { data: lobbies } = await supabase
    .from("match_lobbies")
    .select(`
      *,
      users!match_lobbies_host_id_fkey (id, username, avatar_url),
      lobby_players (
        *,
        users (id, username, avatar_url)
      )
    `)
    .eq("status", "waiting")
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 pb-16 pt-24">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
                <Swords className="h-4 w-4" />
                Match Hub
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Matches & Lobbies
              </h1>
              <p className="mt-2 text-muted-foreground">
                Join active lobbies or browse recent matches
              </p>
            </div>
            {user && (
              <Link
                href="/matches/create"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Users className="h-4 w-4" />
                Create Lobby
              </Link>
            )}
          </div>

          {/* Active Lobbies Section */}
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-bold">Active Lobbies</h2>
            <LobbyList lobbies={lobbies || []} currentUserId={user?.id} />
          </section>

          {/* Recent Matches Section */}
          <section>
            <h2 className="mb-4 text-xl font-bold">Recent Matches</h2>
            <MatchesList matches={matches || []} />
          </section>
        </div>
      </main>
    </div>
  )
}

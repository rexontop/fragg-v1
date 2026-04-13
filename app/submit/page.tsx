import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SubmitMatchForm } from "@/components/submit-match-form"
import { Swords, Shield } from "lucide-react"

export const metadata = {
  title: "Submit Match | FRAGG.GG",
  description: "Submit a new CS2 match to track your stats",
}

export default async function SubmitMatchPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login?redirect=/submit")
  }

  // Get list of all users for player selection
  const { data: users } = await supabase
    .from("users")
    .select("id, username, avatar_url, rank_tier")
    .order("username")

  return (
    <div className="min-h-screen px-4 pb-16 pt-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
            <Swords className="h-4 w-4" />
            Match Submission
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Submit Match
          </h1>
          <p className="mt-2 text-muted-foreground">
            Record your match results and update the leaderboard
          </p>
        </div>

        {/* Info Card */}
        <div className="mb-8 rounded-xl border border-border/50 bg-card p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Match Verification</h3>
              <p className="text-sm text-muted-foreground">
                Submitted matches will be reviewed for accuracy. False submissions may result in account penalties.
                ELO changes are calculated automatically based on the match outcome and player ratings.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <SubmitMatchForm users={users || []} currentUserId={user.id} />
      </div>
    </div>
  )
}

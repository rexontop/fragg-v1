import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Crosshair, Mail, ArrowLeft } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Mail className="h-8 w-8 text-primary" />
        </div>

        <h1 className="mb-2 text-2xl font-bold">Check Your Email</h1>
        <p className="mb-8 text-muted-foreground">
          We&apos;ve sent you a confirmation link. Click the link in your email to activate your account and start tracking your CS2 stats.
        </p>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Crosshair className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              FRAGG<span className="text-primary">.GG</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Once verified, you&apos;ll be able to submit matches, track your ELO, and compete on the leaderboards.
          </p>
        </div>

        <Button variant="outline" className="mt-8 gap-2" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}

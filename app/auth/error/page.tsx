import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowLeft } from "lucide-react"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <div className="w-full max-w-md text-center">
        <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <h1 className="mb-2 text-2xl font-bold">Authentication Error</h1>
        <p className="mb-8 text-muted-foreground">
          Something went wrong during authentication. This could be an expired link or an invalid request.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button variant="outline" className="gap-2" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button asChild>
            <Link href="/auth/login">Try Again</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

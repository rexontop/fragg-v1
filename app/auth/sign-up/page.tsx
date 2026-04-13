"use client"

import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import Link from "next/link"
import { Crosshair, Loader2 } from "lucide-react"

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSteamLogin = async () => {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    
    // Using Discord OAuth as a placeholder - in production you would use Steam OpenID
    // Steam requires custom integration via their Web API
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
          `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Crosshair className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              FRAGG<span className="text-primary">.GG</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-foreground mb-2">Join FRAGG.GG</h1>
          <p className="text-muted-foreground">Connect your Steam account to get started</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">1</div>
              <span className="text-muted-foreground">Connect your Steam account</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">2</div>
              <span className="text-muted-foreground">Customize your weapon skins</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">3</div>
              <span className="text-muted-foreground">Join matches and climb the ranks</span>
            </div>
          </div>

          <button
            onClick={handleSteamLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 bg-[#1b2838] hover:bg-[#2a475e] text-white font-semibold py-4 px-6 rounded-xl transition-colors disabled:opacity-50"
          >
            <svg viewBox="0 0 256 259" className="w-6 h-6" fill="currentColor">
              <path d="M127.779 0C60.42 0 5.24 52.412 0 119.014l68.724 28.674a35.812 35.812 0 0 1 20.426-6.366c.682 0 1.356.019 2.02.056l30.566-44.71v-.627c0-26.903 21.69-48.796 48.353-48.796 26.663 0 48.353 21.893 48.353 48.842 0 26.95-21.69 48.843-48.353 48.843-.372 0-.738-.009-1.104-.019l-43.694 31.478c.028.544.047 1.088.047 1.641 0 20.217-16.311 36.638-36.397 36.638-17.86 0-32.77-12.995-35.858-30.178L1.201 161.79C15.654 216.679 66.095 258.003 127.779 258.003c71.24 0 128.952-58.271 128.952-130.163C256.73 55.748 199.018 0 127.78 0" />
              <path d="M81.186 197.358l-15.575-6.494c2.756 5.732 7.453 10.505 13.559 13.245 13.196 5.92 28.633-.234 34.47-13.744 2.831-6.543 2.878-13.738.131-20.263-2.747-6.525-7.906-11.587-14.527-14.262-6.584-2.656-13.559-2.487-19.671.15l16.078 6.703c9.74 4.07 14.353 15.356 10.318 25.218-4.035 9.862-15.212 14.576-24.943 10.515l.16-.068Z" />
              <path d="M202.705 96.044c0-17.935-14.467-32.537-32.243-32.537-17.775 0-32.242 14.602-32.242 32.537 0 17.936 14.467 32.537 32.242 32.537 17.776 0 32.243-14.601 32.243-32.537Zm-56.367.056c0-13.48 10.81-24.413 24.124-24.413 13.315 0 24.124 10.933 24.124 24.413 0 13.48-10.81 24.413-24.124 24.413-13.315 0-24.124-10.933-24.124-24.413Z" />
            </svg>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Continue with Steam"
            )}
          </button>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>By signing up, you agree to our</p>
            <p>
              <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {" & "}
              <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

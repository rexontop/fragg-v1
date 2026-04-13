import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Trophy, Target, Users, TrendingUp, Crosshair, ChevronRight, Zap, Shield, BarChart3 } from "lucide-react"

const features = [
  {
    icon: Trophy,
    title: "Competitive Rankings",
    description: "Track your ELO rating and climb the leaderboards against the best CS2 players.",
  },
  {
    icon: BarChart3,
    title: "Detailed Analytics",
    description: "Deep dive into your performance with K/D, headshot percentage, and more.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Join a thriving community of competitive players and find your next team.",
  },
  {
    icon: Shield,
    title: "Verified Matches",
    description: "All matches are verified to ensure fair play and accurate statistics.",
  },
]

const stats = [
  { value: "50K+", label: "Active Players" },
  { value: "1.2M", label: "Matches Tracked" },
  { value: "99.9%", label: "Uptime" },
  { value: "24/7", label: "Support" },
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-4 pt-16">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] -translate-x-1/2 translate-y-1/2 rounded-full bg-accent/20 blur-[100px]" />
          <div className="absolute bottom-1/4 right-0 h-[300px] w-[300px] translate-x-1/2 rounded-full bg-primary/10 blur-[80px]" />
        </div>

        {/* Grid Pattern */}
        <div 
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-4 w-4" />
            <span>Season 4 Now Live</span>
            <ChevronRight className="h-4 w-4" />
          </div>

          {/* Main Headline */}
          <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Dominate the{" "}
            <span className="relative">
              <span className="relative z-10 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Competition
              </span>
            </span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            The ultimate CS2 stats tracker. Track your matches, analyze your performance, 
            and climb the ranks with FRAGG.GG&apos;s competitive leaderboards.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="gap-2 px-8" asChild>
              <Link href="/auth/sign-up">
                <Target className="h-5 w-5" />
                Start Tracking
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8" asChild>
              <Link href="/leaderboard">
                <Trophy className="h-5 w-5" />
                View Leaderboard
              </Link>
            </Button>
          </div>

          {/* Stats Row */}
          <div className="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-foreground sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="flex h-10 w-6 items-start justify-center rounded-full border border-border/50 p-1.5">
            <div className="h-2 w-1 animate-bounce rounded-full bg-primary" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-t border-border/50 bg-card/30 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to{" "}
              <span className="text-primary">Level Up</span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Comprehensive tools and analytics to help you improve your game and climb the ranks.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden px-4 py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Crosshair className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to Frag?
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">
            Join thousands of players already tracking their CS2 journey with FRAGG.GG
          </p>
          <Button size="lg" className="gap-2 px-8" asChild>
            <Link href="/auth/sign-up">
              <TrendingUp className="h-5 w-5" />
              Create Free Account
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30 px-4 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Crosshair className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">
                FRAGG<span className="text-primary">.GG</span>
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/leaderboard" className="hover:text-foreground">Leaderboard</Link>
              <Link href="/matches" className="hover:text-foreground">Matches</Link>
              <Link href="/skins" className="hover:text-foreground">Skins</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 FRAGG.GG. Not affiliated with Valve.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

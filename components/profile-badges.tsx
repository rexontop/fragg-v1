"use client"

import { Award, Star } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Badge {
  id: string
  name: string
  description: string
  icon_url: string | null
  rarity: string
}

interface UserBadge {
  id: string
  earned_at: string
  badges: Badge
}

const rarityColors: Record<string, { bg: string; text: string; border: string }> = {
  common: { bg: "bg-zinc-500/20", text: "text-zinc-400", border: "border-zinc-500/30" },
  uncommon: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30" },
  rare: { bg: "bg-blue-500/20", text: "text-blue-400", border: "border-blue-500/30" },
  epic: { bg: "bg-purple-500/20", text: "text-purple-400", border: "border-purple-500/30" },
  legendary: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30" },
}

export function ProfileBadges({ badges }: { badges: UserBadge[] }) {
  if (badges.length === 0) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Badges</h2>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Award className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No badges yet</p>
          <p className="text-sm text-muted-foreground">
            Play matches to earn badges
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card p-6">
      <h2 className="mb-4 text-lg font-semibold">Badges</h2>
      <div className="space-y-3">
        {badges.map((ub) => {
          const badge = ub.badges
          const colors = rarityColors[badge.rarity] || rarityColors.common
          return (
            <div
              key={ub.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${colors.border} ${colors.bg}`}
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors.bg}`}>
                {badge.icon_url ? (
                  <img src={badge.icon_url} alt={badge.name} className="h-6 w-6" />
                ) : (
                  <Star className={`h-5 w-5 ${colors.text}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{badge.name}</p>
                <p className="text-xs text-muted-foreground truncate">{badge.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium capitalize ${colors.bg} ${colors.text}`}>
                  {badge.rarity}
                </span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ub.earned_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Globe, 
  Lock, 
  UserCheck, 
  MapPin, 
  Users, 
  Loader2,
  ArrowLeft,
  Crosshair,
  Check
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Friend {
  id: string
  username: string
  avatar_url: string | null
}

interface CreateLobbyFormProps {
  userId: string
  skinLoadout: Record<string, { skin_id: string; skin_name: string; skin_image: string }>
  friends: Friend[]
}

const MAPS = [
  { id: "dust2", name: "Dust II", image: "/maps/dust2.jpg" },
  { id: "mirage", name: "Mirage", image: "/maps/mirage.jpg" },
  { id: "inferno", name: "Inferno", image: "/maps/inferno.jpg" },
  { id: "nuke", name: "Nuke", image: "/maps/nuke.jpg" },
  { id: "overpass", name: "Overpass", image: "/maps/overpass.jpg" },
  { id: "ancient", name: "Ancient", image: "/maps/ancient.jpg" },
  { id: "anubis", name: "Anubis", image: "/maps/anubis.jpg" },
  { id: "vertigo", name: "Vertigo", image: "/maps/vertigo.jpg" },
]

const VISIBILITY_OPTIONS = [
  { 
    id: "public", 
    name: "Public", 
    description: "Anyone can join",
    icon: Globe 
  },
  { 
    id: "friends", 
    name: "Friends Only", 
    description: "Only your friends can join",
    icon: UserCheck 
  },
  { 
    id: "private", 
    name: "Private", 
    description: "Invite only with code",
    icon: Lock 
  },
]

const PLAYER_COUNTS = [2, 4, 6, 8, 10]

export function CreateLobbyForm({ userId, skinLoadout, friends }: CreateLobbyFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [lobbyName, setLobbyName] = useState("")
  const [selectedMap, setSelectedMap] = useState(MAPS[0].id)
  const [visibility, setVisibility] = useState<"public" | "private" | "friends">("public")
  const [maxPlayers, setMaxPlayers] = useState(10)

  const skinsEquipped = Object.keys(skinLoadout).length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!lobbyName.trim()) {
      setError("Please enter a lobby name")
      setIsSubmitting(false)
      return
    }

    const supabase = createClient()

    // Create the lobby
    const { data: lobby, error: lobbyError } = await supabase
      .from("match_lobbies")
      .insert({
        name: lobbyName.trim(),
        host_id: userId,
        map_name: selectedMap,
        max_players: maxPlayers,
        visibility,
        status: "waiting",
      })
      .select()
      .single()

    if (lobbyError || !lobby) {
      setError(lobbyError?.message || "Failed to create lobby")
      setIsSubmitting(false)
      return
    }

    // Add host as first player
    await supabase
      .from("lobby_players")
      .insert({
        lobby_id: lobby.id,
        user_id: userId,
        team: 1,
      })

    // Navigate to the lobby
    router.push(`/matches/lobby/${lobby.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/matches"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Create Match Lobby</h1>
          <p className="text-sm text-muted-foreground">
            Set up a custom CS2 match with your preferred settings
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Lobby Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Lobby Name</Label>
        <Input
          id="name"
          placeholder="Enter lobby name..."
          value={lobbyName}
          onChange={(e) => setLobbyName(e.target.value)}
          maxLength={50}
        />
      </div>

      {/* Map Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Select Map
        </Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {MAPS.map((map) => (
            <button
              key={map.id}
              type="button"
              onClick={() => setSelectedMap(map.id)}
              className={`relative overflow-hidden rounded-xl border-2 transition-all ${
                selectedMap === map.id
                  ? "border-primary ring-2 ring-primary/50"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="aspect-video bg-muted flex items-center justify-center">
                <span className="text-2xl font-bold text-muted-foreground/50">
                  {map.name.charAt(0)}
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-sm font-medium text-white">{map.name}</p>
              </div>
              {selectedMap === map.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Lobby Visibility
        </Label>
        <div className="grid gap-3 sm:grid-cols-3">
          {VISIBILITY_OPTIONS.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setVisibility(option.id as typeof visibility)}
                className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                  visibility === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  visibility === option.id ? "bg-primary text-primary-foreground" : "bg-muted"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">{option.name}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Max Players */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Max Players
        </Label>
        <div className="flex gap-2">
          {PLAYER_COUNTS.map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => setMaxPlayers(count)}
              className={`flex h-12 w-12 items-center justify-center rounded-lg font-medium transition-all ${
                maxPlayers === count
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {count}
            </button>
          ))}
        </div>
      </div>

      {/* Skin Loadout Preview */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Crosshair className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Your Skin Loadout</p>
              <p className="text-sm text-muted-foreground">
                {skinsEquipped > 0 
                  ? `${skinsEquipped} skins equipped - will be applied in match`
                  : "No skins equipped - using default weapons"
                }
              </p>
            </div>
          </div>
          <Link
            href="/skins"
            className="text-sm font-medium text-primary hover:underline"
          >
            Edit Loadout
          </Link>
        </div>
        
        {skinsEquipped > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {Object.entries(skinLoadout).slice(0, 5).map(([weaponId, skin]) => (
              <div 
                key={weaponId}
                className="flex-shrink-0 w-20 h-14 bg-muted rounded-lg overflow-hidden relative"
              >
                <Image
                  src={skin.skin_image}
                  alt={skin.skin_name}
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </div>
            ))}
            {skinsEquipped > 5 && (
              <div className="flex-shrink-0 w-20 h-14 bg-muted rounded-lg flex items-center justify-center">
                <span className="text-sm font-medium text-muted-foreground">
                  +{skinsEquipped - 5}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Lobby...
          </>
        ) : (
          "Create Lobby"
        )}
      </Button>
    </form>
  )
}

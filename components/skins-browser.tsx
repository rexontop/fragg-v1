"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Check, Search, Loader2, ChevronRight } from "lucide-react"
import Image from "next/image"
import useSWR from "swr"

interface Skin {
  id: string
  name: string
  description: string
  weapon: {
    id: string
    name: string
  }
  category: {
    id: string
    name: string
  }
  pattern: {
    id: string
    name: string
  }
  rarity: {
    id: string
    name: string
    color: string
  }
  image: string
}

interface Weapon {
  id: string
  name: string
}

interface SkinsBrowserProps {
  userId: string
  initialLoadout: Record<string, { skin_id: string; skin_name: string; skin_image: string }>
}

const WEAPON_CATEGORIES = [
  {
    name: "Pistols",
    weapons: [
      { id: "weapon_glock", name: "Glock-18" },
      { id: "weapon_hkp2000", name: "P2000" },
      { id: "weapon_usp_silencer", name: "USP-S" },
      { id: "weapon_elite", name: "Dual Berettas" },
      { id: "weapon_p250", name: "P250" },
      { id: "weapon_tec9", name: "Tec-9" },
      { id: "weapon_fiveseven", name: "Five-SeveN" },
      { id: "weapon_cz75a", name: "CZ75-Auto" },
      { id: "weapon_deagle", name: "Desert Eagle" },
      { id: "weapon_revolver", name: "R8 Revolver" },
    ],
  },
  {
    name: "SMGs",
    weapons: [
      { id: "weapon_mac10", name: "MAC-10" },
      { id: "weapon_mp9", name: "MP9" },
      { id: "weapon_mp7", name: "MP7" },
      { id: "weapon_mp5sd", name: "MP5-SD" },
      { id: "weapon_ump45", name: "UMP-45" },
      { id: "weapon_p90", name: "P90" },
      { id: "weapon_bizon", name: "PP-Bizon" },
    ],
  },
  {
    name: "Rifles",
    weapons: [
      { id: "weapon_galilar", name: "Galil AR" },
      { id: "weapon_famas", name: "FAMAS" },
      { id: "weapon_ak47", name: "AK-47" },
      { id: "weapon_m4a1", name: "M4A4" },
      { id: "weapon_m4a1_silencer", name: "M4A1-S" },
      { id: "weapon_sg556", name: "SG 553" },
      { id: "weapon_aug", name: "AUG" },
      { id: "weapon_ssg08", name: "SSG 08" },
      { id: "weapon_awp", name: "AWP" },
      { id: "weapon_scar20", name: "SCAR-20" },
      { id: "weapon_g3sg1", name: "G3SG1" },
    ],
  },
  {
    name: "Heavy",
    weapons: [
      { id: "weapon_nova", name: "Nova" },
      { id: "weapon_xm1014", name: "XM1014" },
      { id: "weapon_sawedoff", name: "Sawed-Off" },
      { id: "weapon_mag7", name: "MAG-7" },
      { id: "weapon_m249", name: "M249" },
      { id: "weapon_negev", name: "Negev" },
    ],
  },
  {
    name: "Knives",
    weapons: [
      { id: "weapon_knife_karambit", name: "Karambit" },
      { id: "weapon_knife_m9_bayonet", name: "M9 Bayonet" },
      { id: "weapon_bayonet", name: "Bayonet" },
      { id: "weapon_knife_flip", name: "Flip Knife" },
      { id: "weapon_knife_gut", name: "Gut Knife" },
      { id: "weapon_knife_tactical", name: "Huntsman Knife" },
      { id: "weapon_knife_falchion", name: "Falchion Knife" },
      { id: "weapon_knife_survival_bowie", name: "Bowie Knife" },
      { id: "weapon_knife_butterfly", name: "Butterfly Knife" },
      { id: "weapon_knife_push", name: "Shadow Daggers" },
      { id: "weapon_knife_ursus", name: "Ursus Knife" },
      { id: "weapon_knife_gypsy_jackknife", name: "Navaja Knife" },
      { id: "weapon_knife_stiletto", name: "Stiletto Knife" },
      { id: "weapon_knife_widowmaker", name: "Talon Knife" },
      { id: "weapon_knife_skeleton", name: "Skeleton Knife" },
    ],
  },
  {
    name: "Gloves",
    weapons: [
      { id: "weapon_glove_sporty", name: "Sport Gloves" },
      { id: "weapon_glove_slick", name: "Driver Gloves" },
      { id: "weapon_glove_handwrap", name: "Hand Wraps" },
      { id: "weapon_glove_motorcycle", name: "Moto Gloves" },
      { id: "weapon_glove_specialist", name: "Specialist Gloves" },
      { id: "weapon_glove_hydra", name: "Hydra Gloves" },
    ],
  },
]

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const RARITY_COLORS: Record<string, string> = {
  "rarity_common_weapon": "#b0c3d9",
  "rarity_uncommon_weapon": "#5e98d9",
  "rarity_rare_weapon": "#4b69ff",
  "rarity_mythical_weapon": "#8847ff",
  "rarity_legendary_weapon": "#d32ce6",
  "rarity_ancient_weapon": "#eb4b4b",
  "rarity_contraband_weapon": "#e4ae39",
  "rarity_ancient": "#eb4b4b",
  "rarity_legendary": "#d32ce6",
  "rarity_mythical": "#8847ff",
  "rarity_rare": "#4b69ff",
  "rarity_uncommon": "#5e98d9",
  "rarity_common": "#b0c3d9",
}

export function SkinsBrowser({ userId, initialLoadout }: SkinsBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState(WEAPON_CATEGORIES[0].name)
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(WEAPON_CATEGORIES[0].weapons[0] as Weapon)
  const [loadout, setLoadout] = useState(initialLoadout)
  const [searchQuery, setSearchQuery] = useState("")
  const [savingWeapon, setSavingWeapon] = useState<string | null>(null)

  const { data: allSkins, isLoading } = useSWR<Skin[]>(
    "https://bymykel.github.io/CSGO-API/api/en/skins.json",
    fetcher,
    { revalidateOnFocus: false }
  )

  // Filter skins for selected weapon
  const filteredSkins = allSkins?.filter((skin) => {
    const weaponMatch = selectedWeapon && skin.weapon?.id === selectedWeapon.id
    const searchMatch = searchQuery === "" || 
      skin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skin.pattern?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    return weaponMatch && searchMatch
  }) || []

  const handleSelectSkin = async (skin: Skin) => {
    if (!selectedWeapon) return
    
    setSavingWeapon(selectedWeapon.id)
    
    const supabase = createClient()
    
    // Upsert the skin selection
    const { error } = await supabase
      .from("user_skins")
      .upsert({
        user_id: userId,
        weapon_id: selectedWeapon.id,
        skin_id: skin.id,
        skin_name: skin.name,
        skin_image: skin.image,
      }, {
        onConflict: "user_id,weapon_id"
      })

    if (!error) {
      setLoadout((prev) => ({
        ...prev,
        [selectedWeapon.id]: {
          skin_id: skin.id,
          skin_name: skin.name,
          skin_image: skin.image,
        },
      }))
    }
    
    setSavingWeapon(null)
  }

  const handleRemoveSkin = async () => {
    if (!selectedWeapon) return
    
    setSavingWeapon(selectedWeapon.id)
    
    const supabase = createClient()
    
    await supabase
      .from("user_skins")
      .delete()
      .eq("user_id", userId)
      .eq("weapon_id", selectedWeapon.id)

    setLoadout((prev) => {
      const newLoadout = { ...prev }
      delete newLoadout[selectedWeapon.id]
      return newLoadout
    })
    
    setSavingWeapon(null)
  }

  const currentWeapons = WEAPON_CATEGORIES.find((c) => c.name === selectedCategory)?.weapons || []
  const currentSkin = selectedWeapon ? loadout[selectedWeapon.id] : null

  return (
    <div className="flex h-[calc(100vh-5rem)]">
      {/* Left Sidebar - Weapon Categories & List */}
      <div className="w-72 bg-card border-r border-border flex flex-col">
        {/* Category Tabs */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-bold text-foreground mb-3">Weapons</h2>
          <div className="flex flex-wrap gap-1">
            {WEAPON_CATEGORIES.map((category) => (
              <button
                key={category.name}
                onClick={() => {
                  setSelectedCategory(category.name)
                  setSelectedWeapon(category.weapons[0] as Weapon)
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  selectedCategory === category.name
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Weapon List */}
        <div className="flex-1 overflow-y-auto">
          {currentWeapons.map((weapon) => {
            const hasEquipped = loadout[weapon.id]
            return (
              <button
                key={weapon.id}
                onClick={() => setSelectedWeapon(weapon as Weapon)}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors border-b border-border/50 ${
                  selectedWeapon?.id === weapon.id
                    ? "bg-primary/10 text-primary"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium">{weapon.name}</span>
                  {hasEquipped && (
                    <span className="text-xs text-primary">Equipped</span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            )
          })}
        </div>

        {/* Current Loadout Summary */}
        <div className="p-4 border-t border-border bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Equipped Skins</p>
          <p className="text-lg font-bold text-foreground">
            {Object.keys(loadout).length} / {WEAPON_CATEGORIES.reduce((acc, c) => acc + c.weapons.length, 0)}
          </p>
        </div>
      </div>

      {/* Main Content - Skin Grid */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {selectedWeapon?.name || "Select a Weapon"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {currentSkin 
                  ? `Currently equipped: ${currentSkin.skin_name}`
                  : "No skin equipped - using default"
                }
              </p>
            </div>
            {currentSkin && (
              <button
                onClick={handleRemoveSkin}
                disabled={savingWeapon === selectedWeapon?.id}
                className="px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                Remove Skin
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search skins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Skins Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredSkins.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-lg">No skins found</p>
              <p className="text-sm">Try selecting a different weapon or adjusting your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredSkins.map((skin) => {
                const isEquipped = currentSkin?.skin_id === skin.id
                const rarityColor = RARITY_COLORS[skin.rarity?.id] || "#b0c3d9"
                
                return (
                  <button
                    key={skin.id}
                    onClick={() => handleSelectSkin(skin)}
                    disabled={savingWeapon === selectedWeapon?.id}
                    className={`group relative bg-card border rounded-xl p-4 transition-all hover:scale-105 hover:shadow-lg ${
                      isEquipped 
                        ? "border-primary ring-2 ring-primary/50" 
                        : "border-border hover:border-primary/50"
                    }`}
                    style={{ 
                      borderBottomColor: rarityColor,
                      borderBottomWidth: "3px"
                    }}
                  >
                    {isEquipped && (
                      <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    
                    <div className="aspect-video relative mb-3">
                      <Image
                        src={skin.image}
                        alt={skin.name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    
                    <div className="text-left">
                      <p className="text-sm font-medium text-foreground truncate">
                        {skin.pattern?.name || skin.name.split("|")[1]?.trim() || skin.name}
                      </p>
                      <p 
                        className="text-xs truncate"
                        style={{ color: rarityColor }}
                      >
                        {skin.rarity?.name || "Standard"}
                      </p>
                    </div>

                    {savingWeapon === selectedWeapon?.id && (
                      <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

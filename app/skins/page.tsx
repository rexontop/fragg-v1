import { createClient } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { SkinsBrowser } from "@/components/skins-browser"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Skin Changer | FRAGG.GG",
  description: "Customize your weapon skins for CS2 matches",
}

export default async function SkinsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's saved skin loadout
  const { data: userSkins } = await supabase
    .from("user_skins")
    .select("*")
    .eq("user_id", user.id)

  const loadout: Record<string, { skin_id: string; skin_name: string; skin_image: string }> = {}
  userSkins?.forEach((skin) => {
    loadout[skin.weapon_id] = {
      skin_id: skin.skin_id,
      skin_name: skin.skin_name,
      skin_image: skin.skin_image,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20">
        <SkinsBrowser userId={user.id} initialLoadout={loadout} />
      </main>
    </div>
  )
}

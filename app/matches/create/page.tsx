import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { CreateLobbyForm } from "@/components/create-lobby-form"

export const metadata = {
  title: "Create Lobby | FRAGG.GG",
  description: "Create a custom CS2 match lobby",
}

export default async function CreateLobbyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's skin loadout
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

  // Fetch friends for friends-only lobby option
  const { data: friends } = await supabase
    .from("friends")
    .select(`
      friend:users!friends_friend_id_fkey (id, username, avatar_url)
    `)
    .eq("user_id", user.id)
    .eq("status", "accepted")

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="px-4 pb-16 pt-24">
        <div className="mx-auto max-w-2xl">
          <CreateLobbyForm 
            userId={user.id} 
            skinLoadout={loadout}
            friends={friends?.map(f => f.friend) || []}
          />
        </div>
      </main>
    </div>
  )
}

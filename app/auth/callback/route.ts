import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  // Standard OAuth code exchange
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Steam OpenID callback
  const steamParams = new URLSearchParams()
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("openid.")) {
      steamParams.append(key, value)
    }
  }

  if (steamParams.size > 0) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    try {
      const verifyResponse = await fetch(
        `${supabaseUrl}/functions/v1/steam-auth`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anonKey}`,
          },
          body: JSON.stringify(Object.fromEntries(steamParams)),
        }
      )

      console.log("Verify response status:", verifyResponse.status)

      if (!verifyResponse.ok) {
        const errText = await verifyResponse.text()
        console.error("Steam verify failed:", errText)
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      const steamData = await verifyResponse.json() as {
        steam_id: string
        username: string
        avatar: string
      }

      console.log("Steam data:", steamData)

      const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey)

      const { data: existingProfile } = await adminSupabase
        .from("user_profiles")
        .select("id")
        .eq("steam_id", steamData.steam_id)
        .maybeSingle()

      let userId: string

      if (existingProfile) {
        userId = existingProfile.id
        console.log("Existing user:", userId)
      } else {
        const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
          email: `${steamData.steam_id}@steam.fragg.gg`,
          password: crypto.randomUUID(),
          email_confirm: true,
          user_metadata: {
            steam_id: steamData.steam_id,
            username: steamData.username,
            avatar_url: steamData.avatar,
          },
        })

        if (createError || !newUser.user) {
          console.error("Create user error:", createError)
          return NextResponse.redirect(`${origin}/auth/error`)
        }

        userId = newUser.user.id
        console.log("New user created:", userId)

        await adminSupabase
          .from("user_profiles")
          .insert({
            id: userId,
            steam_id: steamData.steam_id,
            username: steamData.username,
            avatar_url: steamData.avatar,
          })
      }

      const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: "magiclink",
        email: `${steamData.steam_id}@steam.fragg.gg`,
      })

      if (linkError || !linkData) {
        console.error("Magic link error:", linkError)
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      const actionLink = linkData.properties.action_link
      return NextResponse.redirect(actionLink)

    } catch (error) {
      console.error("Steam auth error:", error)
      return NextResponse.redirect(`${origin}/auth/error`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
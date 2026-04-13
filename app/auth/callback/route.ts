import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  const steamParams: Record<string, string> = {}
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("openid.")) {
      steamParams[key] = value
    }
  }

  if (Object.keys(steamParams).length > 0) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    try {
      const claimedID = steamParams["openid.claimed_id"]

      if (!claimedID?.includes("steamcommunity.com/openid/id/")) {
        console.error("Invalid claimed_id:", claimedID)
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      const match = claimedID.match(/\/(\d+)$/)
      const steamID = match ? match[1] : null

      if (!steamID) {
        console.error("Could not extract Steam ID")
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      console.log("Steam ID:", steamID)

      const steamApiKey = process.env.STEAM_API_KEY
      let username = `Player_${steamID}`
      let avatar = ""

      if (steamApiKey) {
        const steamInfoRes = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamID}`
        )
        const steamInfo = await steamInfoRes.json() as {
          response: { players: Array<{ personaname: string; avatarfull: string }> }
        }
        const player = steamInfo.response.players[0]
        if (player) {
          username = player.personaname
          avatar = player.avatarfull
        }
      }

      console.log("Steam user:", username)

      const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey)

      const { data: existingProfile } = await adminSupabase
        .from("user_profiles")
        .select("id")
        .eq("steam_id", steamID)
        .maybeSingle()

      let userId: string

      if (existingProfile) {
        userId = existingProfile.id
        console.log("Existing user:", userId)
      } else {
        const { data: allUsers } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
        const foundUser = allUsers?.users?.find(u => u.email === `${steamID}@steam.fragg.gg`)

        if (foundUser) {
          userId = foundUser.id
          console.log("Existing auth user:", userId)
        } else {
          const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
            email: `${steamID}@steam.fragg.gg`,
            password: crypto.randomUUID(),
            email_confirm: true,
            user_metadata: {
              steam_id: steamID,
              username,
              avatar_url: avatar,
            },
          })

          if (createError || !newUser.user) {
            console.error("Create user error:", createError)
            return NextResponse.redirect(`${origin}/auth/error`)
          }

          userId = newUser.user.id
          console.log("New user created:", userId)
        }

        await adminSupabase
          .from("user_profiles")
          .upsert({
            id: userId,
            steam_id: steamID,
            username,
            avatar_url: avatar,
          })
      }

      const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: "magiclink",
        email: `${steamID}@steam.fragg.gg`,
        options: {
          redirectTo: `${origin}/`,
        }
      })

      if (linkError || !linkData) {
        console.error("Magic link error:", linkError)
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      const actionLink = linkData.properties.action_link
      console.log("Redirecting to magic link...")
      return NextResponse.redirect(actionLink)

    } catch (error) {
      console.error("Steam auth error:", error)
      return NextResponse.redirect(`${origin}/auth/error`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
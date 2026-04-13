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
      // Verify directly with Steam from Vercel
      const verifyParams = new URLSearchParams()
      for (const [key, value] of Object.entries(steamParams)) {
        if (key === "openid.mode") {
          verifyParams.append("openid.mode", "check_auth")
        } else {
          verifyParams.append(key, value)
        }
      }

      console.log("Verifying with Steam directly...")
      console.log("Params:", verifyParams.toString())

      const steamVerify = await fetch("https://steamcommunity.com/openid/login", {
        method: "POST",
        body: verifyParams.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })

      const verifyText = await steamVerify.text()
      console.log("Steam verify response:", verifyText.substring(0, 300))

      if (!verifyText.includes("is_valid:true")) {
        console.error("Steam verification failed")
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      // Extract Steam ID
      const claimedID = steamParams["openid.claimed_id"]
      const match = claimedID?.match(/\/(\d+)$/)
      const steamID = match ? match[1] : null

      if (!steamID) {
        console.error("Invalid Steam ID")
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      console.log("Steam ID:", steamID)

      // Get Steam user info
      const steamApiKey = process.env.STEAM_API_KEY
      let username = `Player_${steamID}`
      let avatar = ""

      if (steamApiKey) {
        const steamInfoRes = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamID}`
        )
        const steamInfo = await steamInfoRes.json() as { response: { players: Array<{ personaname: string; avatarfull: string }> } }
        const player = steamInfo.response.players[0]
        if (player) {
          username = player.personaname
          avatar = player.avatarfull
        }
      }

      console.log("Steam user:", username)

      // Use admin client
      const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey)

      // Check if user exists
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

        await adminSupabase
          .from("user_profiles")
          .insert({
            id: userId,
            steam_id: steamID,
            username,
            avatar_url: avatar,
          })
      }

      // Generate magic link
      const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: "magiclink",
        email: `${steamID}@steam.fragg.gg`,
      })

      if (linkError || !linkData) {
        console.error("Magic link error:", linkError)
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      const actionLink = linkData.properties.action_link
      console.log("Redirecting to:", actionLink)
      return NextResponse.redirect(actionLink)

    } catch (error) {
      console.error("Steam auth error:", error)
      return NextResponse.redirect(`${origin}/auth/error`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
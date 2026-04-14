import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"
  
  // 1. DYNAMIC ORIGIN: This ensures the redirect matches your current domain (www vs non-www)
  const requestUrl = new URL(request.url)
  const origin = requestUrl.origin

  // PHASE 1: Handle the return from the Magic Link
  // This is the part that actually saves the session/cookie to the browser
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log("Session established! Redirecting home...")
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      console.error("Auth code exchange error:", error.message)
      return NextResponse.redirect(`${origin}/auth/error`)
    }
  }

  // PHASE 2: Handle the initial return from Steam OpenID
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
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      const match = claimedID.match(/\/(\d+)$/)
      const steamID = match ? match[1] : null
      if (!steamID) return NextResponse.redirect(`${origin}/auth/error`)

      // Fetch Steam Profile Data
      const steamApiKey = process.env.STEAM_API_KEY
      let username = `Player_${steamID}`
      let avatar = ""

      if (steamApiKey) {
        const steamInfoRes = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamID}`
        )
        const steamInfo = await steamInfoRes.json() as any
        const player = steamInfo.response.players[0]
        if (player) {
          username = player.personaname
          avatar = player.avatarfull
        }
      }

      const adminSupabase = createAdminClient(supabaseUrl, serviceRoleKey)

      // Check for existing profile in your public.users table
      const { data: existingProfile } = await adminSupabase
        .from("users") // Ensure this matches your table name (users or user_profiles)
        .select("id")
        .eq("steam_id", steamID)
        .maybeSingle()

      let userId: string

      if (existingProfile) {
        userId = existingProfile.id
      } else {
        // Create user in Auth if they don't exist
        const email = `${steamID}@steam.fragg.gg`
        const { data: allUsers } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
        const foundUser = allUsers?.users?.find(u => u.email === email)

        if (foundUser) {
          userId = foundUser.id
        } else {
          const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
            email: email,
            password: crypto.randomUUID(),
            email_confirm: true,
            user_metadata: { steam_id: steamID, username, avatar_url: avatar },
          })

          if (createError || !newUser.user) throw createError
          userId = newUser.user.id
        }

        // Sync to public table
        await adminSupabase.from("users").upsert({
          id: userId,
          steam_id: steamID,
          username,
          avatar_url: avatar,
        })
      }

      // PHASE 3: Generate the login link
      // This sends the user to Supabase to "Sign In" via the email we just created
      const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
        type: "magiclink",
        email: `${steamID}@steam.fragg.gg`,
        options: {
          // IMPORTANT: Redirect back to this SAME file so PHASE 1 can run
          redirectTo: `${origin}/auth/callback`, 
        }
      })

      if (linkError || !linkData) throw linkError

      // Final redirect to the magic link which will then circle back here with a ?code=
      return NextResponse.redirect(linkData.properties.action_link)

    } catch (error) {
      console.error("Steam auth critical error:", error)
      return NextResponse.redirect(`${origin}/auth/error`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
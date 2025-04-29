import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get("code")

    if (!code) {
      console.error("Auth callback: No code provided")
      return NextResponse.redirect(`${requestUrl.origin}/login?error=missing_code`)
    }

    // Create a Supabase client with cookie storage
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error("Auth callback: Code exchange failed", error)
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=exchange_failed&message=${encodeURIComponent(error.message)}`,
      )
    }

    if (!data.session) {
      console.error("Auth callback: No session created")
      return NextResponse.redirect(`${requestUrl.origin}/login?error=no_session`)
    }

    console.log("Auth callback: Session established for", data.session.user.email)

    // Redirect to the client-side callback page to handle the session
    return NextResponse.redirect(`${requestUrl.origin}/auth/callback?code=${code}`)
  } catch (error) {
    console.error("Auth callback exception:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=exception&message=${encodeURIComponent(errorMessage)}`,
    )
  }
}

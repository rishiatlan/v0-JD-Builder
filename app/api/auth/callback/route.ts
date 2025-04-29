import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const type = requestUrl.searchParams.get("type")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // If this is a password reset, redirect to the reset-password page
    if (type === "recovery") {
      return NextResponse.redirect(`${requestUrl.origin}/reset-password?recovery=true`)
    }
  }

  // For other auth flows, redirect to the home page
  return NextResponse.redirect(`${requestUrl.origin}/`)
}

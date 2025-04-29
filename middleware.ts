import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res: NextResponse.next() })

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession()

  // Get the pathname
  const { pathname } = request.nextUrl

  // Check if the pathname is excluded from authentication
  const isAuthPath =
    pathname === "/login" ||
    pathname === "/auth/callback" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.includes(".")

  // If it's not an auth path, check for authentication
  if (!isAuthPath) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session, redirect to login
    if (!session) {
      const url = new URL("/login", request.url)
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}

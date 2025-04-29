import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl

    // These paths should always be accessible without authentication
    const publicPaths = ["/login", "/auth/callback"]

    // Check if the current path is public
    const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))

    // Also exclude static files and API routes
    const isExcludedPath = pathname.startsWith("/_next") || pathname.startsWith("/api/") || pathname.includes(".")

    // If it's a public path or excluded path, allow access
    if (isPublicPath || isExcludedPath) {
      return NextResponse.next()
    }

    // Create a response to modify
    const res = NextResponse.next()

    // Create a Supabase client
    const supabase = createMiddlewareClient({ req: request, res })

    // Refresh the session if it exists
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If no session, redirect to login
    if (!session) {
      console.log(`Middleware: Redirecting unauthenticated request from ${pathname} to login`)
      const url = new URL("/login", request.url)
      url.searchParams.set("redirect", pathname)
      return NextResponse.redirect(url)
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // In case of error, allow the request to continue
    return NextResponse.next()
  }
}

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

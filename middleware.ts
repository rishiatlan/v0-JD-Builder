import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Add the auth callback route to the publicRoutes array
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/api/auth/callback",
  // ... any other existing public routes
]

export function middleware(request: NextRequest) {
  // Check if the request is for the admin route
  if (request.nextUrl.pathname.startsWith("/admin")) {
    // In a real app, you would check for authentication here
    // For now, we'll just allow access in development
    if (process.env.NODE_ENV === "development") {
      return NextResponse.next()
    }

    // In production, you would redirect to login or check for admin role
    // This is a placeholder for now
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}

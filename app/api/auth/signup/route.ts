import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth-service"

export async function POST(request: Request) {
  try {
    const { email, password, metadata } = await request.json()

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await AuthService.signUp(email, password, metadata)

    if (!result.success) {
      console.error("Auth service signup error:", result.error)
      return NextResponse.json({ error: result.error || "Failed to create account" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Signup route error:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

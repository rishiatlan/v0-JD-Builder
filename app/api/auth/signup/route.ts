import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth-service"

export async function POST(request: Request) {
  try {
    const { email, password, metadata } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const result = await AuthService.signUp(email, password, metadata)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Sign up error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth-service"

export async function POST() {
  try {
    await AuthService.signOut()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Sign out error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

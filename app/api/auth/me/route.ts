import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth-service"

export async function GET() {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Get current user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

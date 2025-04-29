import { NextResponse } from "next/server"
import { AuthService } from "@/lib/auth-service"

export async function PUT(request: Request) {
  try {
    const user = await AuthService.getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const profile = await request.json()

    const result = await AuthService.updateProfile(user.id, profile)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

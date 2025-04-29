import { NextResponse } from "next/server"
import { setupDatabase } from "@/app/actions/db-setup"

export async function POST() {
  try {
    const result = await setupDatabase()

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    console.error("Database initialization error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

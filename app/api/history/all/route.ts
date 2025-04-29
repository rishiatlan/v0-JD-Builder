import { NextResponse } from "next/server"
import { getAllHistory } from "@/app/actions/admin-actions"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const limit = Number.parseInt(url.searchParams.get("limit") || "50", 10)

    const result = await getAllHistory(limit)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ history: result.history })
  } catch (error) {
    console.error("Error in history API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

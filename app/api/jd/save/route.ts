import { NextResponse } from "next/server"
import { saveJobDescription } from "@/app/actions/saveJobDescription"

export async function POST(request: Request) {
  try {
    const jdData = await request.json()

    try {
      const result = await saveJobDescription(jdData)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to save job description" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in save JD API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

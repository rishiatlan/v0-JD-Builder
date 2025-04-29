import { NextResponse } from "next/server"
import { deleteJobDescription } from "@/app/actions/deleteJobDescription"

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get("id")
    const email = url.searchParams.get("email") || undefined

    if (!id) {
      return NextResponse.json({ success: false, error: "Job description ID is required" }, { status: 400 })
    }

    try {
      const result = await deleteJobDescription(id, email)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error.message || "Failed to delete job description" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in delete JD API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

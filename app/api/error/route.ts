import { NextResponse } from "next/server"
import { getServiceSupabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const supabase = getServiceSupabase()
    const body = await request.json()

    const { errorMessage, errorStack, context, userEmail } = body

    if (!errorMessage) {
      return NextResponse.json({ error: "Error message is required" }, { status: 400 })
    }

    // Log error to Supabase
    const { data: errorLog, error: insertError } = await supabase
      .from("error_logs")
      .insert({
        user_email: userEmail || null,
        error_message: errorMessage,
        error_stack: errorStack || null,
        context: context || null,
        status: "new",
      })
      .select()

    if (insertError) {
      console.error("Failed to log error to database:", insertError)
      return NextResponse.json({ error: "Failed to log error" }, { status: 500 })
    }

    // Send email notification using Supabase Edge Functions
    const { data: emailResult, error: emailError } = await supabase.functions.invoke("send-error-notification", {
      body: {
        errorId: errorLog?.[0]?.id,
        errorMessage,
        errorStack,
        context,
        userEmail,
        recipients: ["rishi.banerjee@atlan.com", "naman.jain@atlan.com"],
      },
    })

    if (emailError) {
      console.error("Failed to send error notification email:", emailError)
      // We still return success since the error was logged
    }

    return NextResponse.json({ success: true, errorId: errorLog?.[0]?.id })
  } catch (error) {
    console.error("Error in error logging API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

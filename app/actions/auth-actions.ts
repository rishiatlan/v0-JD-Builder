"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

export async function getCurrentUser() {
  const cookieStore = cookies()
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function sendMagicLink(email: string) {
  try {
    // Create an admin client with the service role key for full control
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key needed for admin API
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // The exact callback URL we want to use
    const redirectTo = "https://v0-jd-builder-beta.vercel.app/auth/callback"

    console.log("Generating magic link with redirect to:", redirectTo)

    // Generate the magic link with explicit redirect
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo,
      },
    })

    if (error) {
      console.error("Error generating magic link:", error)
      return { success: false, error: error.message }
    }

    if (!data?.properties?.action_link) {
      console.error("No action link generated")
      return { success: false, error: "Failed to generate magic link" }
    }

    // Log the generated link for debugging (remove in production)
    console.log("Generated magic link:", data.properties.action_link)

    // Send the email using Supabase's built-in email service
    const { error: emailError } = await supabaseAdmin.auth.admin.sendEmail(email, {
      type: "magiclink",
      actionLink: data.properties.action_link,
    })

    if (emailError) {
      console.error("Error sending magic link email:", emailError)
      return { success: false, error: emailError.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Exception sending magic link:", error)
    return { success: false, error: error.message || "Failed to send magic link" }
  }
}

export async function signOut() {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Error signing out:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Exception signing out:", error)
    return { success: false, error: error.message || "Failed to sign out" }
  }
}

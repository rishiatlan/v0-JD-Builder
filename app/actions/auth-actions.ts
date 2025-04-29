"use server"

import { cookies } from "next/headers"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
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
    const cookieStore = cookies()
    const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore })

    // Make sure to set the correct redirect URL
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://v0-jd-builder-beta.vercel.app/auth/callback",
      },
    })

    if (error) {
      console.error("Error sending magic link:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Exception sending magic link:", error)
    return { success: false, error: error.message || "Failed to send magic link" }
  }
}

// Make sure the signOut function is properly exported
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

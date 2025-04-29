"use server"

import { cookies } from "next/headers"
import { AuthService } from "@/lib/auth-service"
import { getSession, destroySession } from "@/lib/session"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { revalidatePath } from "next/cache"

export async function sendMagicLink(formData: FormData) {
  try {
    const email = formData.get("email") as string

    if (!email) {
      return { success: false, error: "Email is required" }
    }

    return await AuthService.sendMagicLink(email)
  } catch (error) {
    console.error("Send magic link action error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send magic link",
    }
  }
}

export async function signOut() {
  try {
    // Sign out from Supabase
    const supabase = createServerActionClient({ cookies })
    await supabase.auth.signOut()

    // Also destroy our custom session
    await destroySession()

    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error("Sign out action error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sign out",
    }
  }
}

export async function getCurrentUser() {
  try {
    // First try to get user from Supabase
    const supabase = createServerActionClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      return {
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata.full_name || null,
      }
    }

    // If no Supabase user, try our custom session
    const session = await getSession()
    return session
  } catch (error) {
    console.error("Get current user action error:", error)
    return null
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const full_name = formData.get("full_name") as string | null

    return await AuthService.updateProfile(user.id, { full_name })
  } catch (error) {
    console.error("Update profile action error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    }
  }
}

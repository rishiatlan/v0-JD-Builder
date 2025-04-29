"use server"
import { redirect } from "next/navigation"
import { AuthService } from "@/lib/auth-service"
import type { UserSession } from "@/lib/session"

export async function sendMagicLink(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const email = formData.get("email") as string

    if (!email) {
      return { success: false, error: "Email is required" }
    }

    return await AuthService.sendMagicLink(email)
  } catch (error) {
    console.error("Send magic link error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send magic link",
    }
  }
}

export async function signOut(): Promise<void> {
  try {
    await AuthService.signOut()
    redirect("/")
  } catch (error) {
    console.error("Sign out error:", error)
    throw error
  }
}

export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const user = await AuthService.getCurrentUser()
    return user ? { id: user.id, email: user.email, full_name: user.full_name } : null
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}

export async function updateProfile(_: any, formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await AuthService.getCurrentUser()
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    const full_name = formData.get("full_name") as string

    return await AuthService.updateProfile(user.id, { full_name })
  } catch (error) {
    console.error("Update profile error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update profile",
    }
  }
}

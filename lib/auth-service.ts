import { supabase } from "@/lib/supabase"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
}

export class AuthService {
  static async sendMagicLink(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate email domain
      if (!email.endsWith("@atlan.com")) {
        return {
          success: false,
          error: "Only @atlan.com email addresses are allowed",
        }
      }

      // Send magic link
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        },
      })

      if (error) {
        console.error("Magic link error:", error)
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      console.error("Auth service error:", error)
      return { success: false, error: error.message || "Failed to send magic link" }
    }
  }

  static async signOut(): Promise<void> {
    await supabase.auth.signOut()
  }

  static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        return null
      }

      return {
        id: data.user.id,
        email: data.user.email!,
        full_name: data.user.user_metadata.full_name || null,
      }
    } catch (error) {
      console.error("Get current user error:", error)
      return null
    }
  }

  static async updateProfile(
    userId: string,
    profile: { full_name?: string },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profile.full_name || null,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error("Update profile error:", error)
      return { success: false, error: error.message || "Failed to update profile" }
    }
  }
}

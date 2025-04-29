import { supabase } from "@/lib/supabase"
import { getSession, destroySession } from "@/lib/session"

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

      // Send magic link with 1-hour expiration
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          // Set magic link to expire after 1 hour (3600 seconds)
          emailLinkExpirationIn: 3600,
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
    // Sign out from Supabase
    await supabase.auth.signOut()

    // Also destroy our custom session
    await destroySession()
  }

  static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      // First try to get user from Supabase
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

      if (session) {
        return {
          id: session.id,
          email: session.email,
          full_name: session.full_name,
        }
      }

      return null
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

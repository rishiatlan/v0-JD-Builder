import { supabase } from "@/lib/supabase"
import { createSession, destroySession } from "@/lib/session"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
}

export class AuthService {
  static async signUp(
    email: string,
    password: string,
    metadata?: { full_name?: string },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Use Supabase auth to sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: metadata?.full_name || null,
          },
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Create a session in our custom session system
      if (data.user) {
        await createSession({ id: data.user.id, email })
      }

      return { success: true }
    } catch (error) {
      console.error("Sign up error:", error)
      return { success: false, error: error.message || "Failed to sign up" }
    }
  }

  static async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Use Supabase auth to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { success: false, error: "Invalid email or password" }
      }

      // Create a session in our custom session system
      if (data.user) {
        await createSession({ id: data.user.id, email })
      }

      return { success: true }
    } catch (error) {
      console.error("Sign in error:", error)
      return { success: false, error: error.message || "Failed to sign in" }
    }
  }

  static async signOut(): Promise<void> {
    await supabase.auth.signOut()
    await destroySession()
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

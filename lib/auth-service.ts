import { query } from "@/lib/db"
import { compare, hash } from "bcrypt"
import { createSession, destroySession } from "@/lib/session"

const SALT_ROUNDS = 10

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
      // Check if user already exists
      const existingUser = await query<{ id: string }>("SELECT id FROM user_profiles WHERE email = $1", [email])

      if (existingUser.length > 0) {
        return { success: false, error: "User with this email already exists" }
      }

      // Hash password
      const passwordHash = await hash(password, SALT_ROUNDS)

      // Create user
      const insertQuery = `
        INSERT INTO user_profiles (email, full_name, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, full_name
      `

      const now = new Date().toISOString()
      const result = await query<UserProfile>(insertQuery, [email, metadata?.full_name || null, passwordHash, now, now])

      if (result.length === 0) {
        return { success: false, error: "Failed to create user" }
      }

      // Create session
      await createSession({ id: result[0].id, email })

      return { success: true }
    } catch (error) {
      console.error("Sign up error:", error)
      return { success: false, error: error.message || "Failed to sign up" }
    }
  }

  static async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get user
      const users = await query<{ id: string; password_hash: string }>(
        "SELECT id, password_hash FROM user_profiles WHERE email = $1",
        [email],
      )

      if (users.length === 0) {
        return { success: false, error: "Invalid email or password" }
      }

      const user = users[0]

      // Verify password
      const isPasswordValid = await compare(password, user.password_hash)

      if (!isPasswordValid) {
        return { success: false, error: "Invalid email or password" }
      }

      // Create session
      await createSession({ id: user.id, email })

      return { success: true }
    } catch (error) {
      console.error("Sign in error:", error)
      return { success: false, error: error.message || "Failed to sign in" }
    }
  }

  static async signOut(): Promise<void> {
    await destroySession()
  }

  static async updateProfile(
    userId: string,
    profile: { full_name?: string },
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateQuery = `
        UPDATE user_profiles
        SET full_name = $1, updated_at = $2
        WHERE id = $3
        RETURNING id, email, full_name
      `

      const result = await query<UserProfile>(updateQuery, [
        profile.full_name || null,
        new Date().toISOString(),
        userId,
      ])

      if (result.length === 0) {
        return { success: false, error: "User not found" }
      }

      return { success: true }
    } catch (error) {
      console.error("Update profile error:", error)
      return { success: false, error: error.message || "Failed to update profile" }
    }
  }
}

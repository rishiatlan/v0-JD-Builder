import { cookies } from "next/headers"
import { sign, verify } from "jsonwebtoken"
import { query } from "@/lib/db"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"
const TOKEN_EXPIRY = "7d"

export interface UserSession {
  id: string
  email: string
  full_name: string | null
}

export async function createSession(user: { id: string; email: string }): Promise<string> {
  // Generate JWT token
  const token = sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY })

  // Set cookie
  cookies().set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  })

  return token
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const token = cookies().get("auth_token")?.value

    if (!token) {
      return null
    }

    try {
      const decoded = verify(token, JWT_SECRET) as { id: string; email: string }

      const users = await query<UserSession>("SELECT id, email, full_name FROM user_profiles WHERE id = $1", [
        decoded.id,
      ])

      if (users.length === 0) {
        return null
      }

      return users[0]
    } catch (error) {
      // Invalid token
      cookies().delete("auth_token")
      return null
    }
  } catch (error) {
    console.error("Get session error:", error)
    return null
  }
}

export async function destroySession(): Promise<void> {
  cookies().delete("auth_token")
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession()

  if (!session) {
    throw new Error("Authentication required")
  }

  return session
}

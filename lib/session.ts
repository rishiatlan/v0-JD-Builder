import { cookies } from "next/headers"
import { query } from "@/lib/db"
import { generateRandomString, hashString } from "@/lib/browser-crypto"

export interface UserSession {
  id: string
  email: string
  full_name: string | null
}

// Generate a random session token
function generateSessionToken(): string {
  return generateRandomString(32)
}

// Hash a session token for storage
async function hashToken(token: string): Promise<string> {
  return await hashString(token)
}

export async function createSession(user: { id: string; email: string }): Promise<string> {
  try {
    // Generate a random session token
    const sessionToken = generateSessionToken()
    const hashedToken = await hashToken(sessionToken)

    // Store the session in the database
    const insertQuery = `
      INSERT INTO user_sessions (
        user_id,
        token_hash,
        expires_at
      )
      VALUES ($1, $2, $3)
      RETURNING id
    `

    // Session expires in 7 days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await query(insertQuery, [user.id, hashedToken, expiresAt.toISOString()])

    // Set the session cookie
    cookies().set("session_token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return sessionToken
  } catch (error) {
    console.error("Error creating session:", error)
    throw new Error("Failed to create session")
  }
}

export async function getSession(): Promise<UserSession | null> {
  try {
    const sessionToken = cookies().get("session_token")?.value

    if (!sessionToken) {
      return null
    }

    const hashedToken = await hashToken(sessionToken)

    // Get the session from the database
    const sessionQuery = `
      SELECT 
        s.user_id,
        s.expires_at,
        u.email,
        u.full_name
      FROM 
        user_sessions s
      JOIN 
        user_profiles u ON s.user_id = u.id
      WHERE 
        s.token_hash = $1 AND
        s.expires_at > $2
    `

    const now = new Date().toISOString()
    const sessions = await query<{
      user_id: string
      email: string
      full_name: string | null
      expires_at: string
    }>(sessionQuery, [hashedToken, now])

    if (sessions.length === 0) {
      // Session not found or expired
      cookies().delete("session_token")
      return null
    }

    const session = sessions[0]

    return {
      id: session.user_id,
      email: session.email,
      full_name: session.full_name,
    }
  } catch (error) {
    console.error("Get session error:", error)
    return null
  }
}

export async function destroySession(): Promise<void> {
  try {
    const sessionToken = cookies().get("session_token")?.value

    if (sessionToken) {
      const hashedToken = await hashToken(sessionToken)

      // Delete the session from the database
      const deleteQuery = `
        DELETE FROM user_sessions
        WHERE token_hash = $1
      `

      await query(deleteQuery, [hashedToken])
    }

    cookies().delete("session_token")
  } catch (error) {
    console.error("Error destroying session:", error)
  }
}

export async function requireAuth(): Promise<UserSession> {
  const session = await getSession()

  if (!session) {
    throw new Error("Authentication required")
  }

  return session
}

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { sendMagicLink, signOut, getCurrentUser, updateProfile } from "@/app/actions/auth-actions"
import type { UserSession } from "@/lib/session"

interface AuthState {
  user: UserSession | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface AuthContextType {
  authState: AuthState
  sendMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  updateProfile: (profile: any) => Promise<{ success: boolean; error?: string }>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  })

  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await getCurrentUser()

        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: !!user,
          error: null,
        })
      } catch (error) {
        console.error("Auth initialization error:", error)
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: error instanceof Error ? error.message : "Authentication initialization failed",
        })
      }
    }

    initAuth()
  }, [])

  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }))
  }

  const handleSendMagicLink = async (email: string) => {
    try {
      const formData = new FormData()
      formData.append("email", email)

      const result = await sendMagicLink(formData)

      if (!result.success) {
        setAuthState((prev) => ({
          ...prev,
          error: result.error || "Failed to send magic link",
        }))
      }

      return result
    } catch (error) {
      console.error("Send magic link error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to send magic link"
      setAuthState((prev) => ({
        ...prev,
        error: errorMessage,
      }))
      return { success: false, error: errorMessage }
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: null,
      })

      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
      setAuthState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Sign out failed",
      }))
    }
  }

  const handleUpdateProfile = async (profile: any) => {
    try {
      const formData = new FormData()
      if (profile.full_name) {
        formData.append("full_name", profile.full_name)
      }

      const result = await updateProfile(formData)

      if (result.success) {
        const user = await getCurrentUser()

        setAuthState((prev) => ({
          ...prev,
          user,
          error: null,
        }))
      } else {
        setAuthState((prev) => ({
          ...prev,
          error: result.error || "Profile update failed",
        }))
      }

      return result
    } catch (error) {
      console.error("Update profile error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update profile"
      setAuthState((prev) => ({
        ...prev,
        error: errorMessage,
      }))
      return { success: false, error: errorMessage }
    }
  }

  const contextValue: AuthContextType = {
    authState,
    sendMagicLink: handleSendMagicLink,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    clearError,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

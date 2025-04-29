"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, signUp, signOut, getCurrentUser, updateProfile } from "@/app/actions/auth-actions"
import type { UserSession } from "@/lib/session"

interface AuthState {
  user: UserSession | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextType {
  authState: AuthState
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, metadata?: any) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  updateProfile: (profile: any) => Promise<{ success: boolean; error?: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
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
        })
      } catch (error) {
        console.error("Auth initialization error:", error)
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    initAuth()
  }, [])

  const handleSignIn = async (email: string, password: string) => {
    try {
      const result = await signIn(null, new FormData(Object.entries({ email, password })))

      if (result.success) {
        const user = await getCurrentUser()

        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: !!user,
        })
      }

      return result
    } catch (error) {
      console.error("Sign in error:", error)
      return { success: false, error: error.message || "Failed to sign in" }
    }
  }

  const handleSignUp = async (email: string, password: string, metadata?: any) => {
    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)
      if (metadata?.full_name) {
        formData.append("full_name", metadata.full_name)
      }

      const result = await signUp(null, formData)

      if (result.success) {
        const user = await getCurrentUser()

        setAuthState({
          user,
          isLoading: false,
          isAuthenticated: !!user,
        })
      }

      return result
    } catch (error) {
      console.error("Sign up error:", error)
      return { success: false, error: error.message || "Failed to sign up" }
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })

      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  const handleUpdateProfile = async (profile: any) => {
    try {
      const formData = new FormData()
      if (profile.full_name) {
        formData.append("full_name", profile.full_name)
      }

      const result = await updateProfile(null, formData)

      if (result.success) {
        const user = await getCurrentUser()

        setAuthState((prev) => ({
          ...prev,
          user,
        }))
      }

      return result
    } catch (error) {
      console.error("Update profile error:", error)
      return { success: false, error: error.message || "Failed to update profile" }
    }
  }

  const contextValue: AuthContextType = {
    authState,
    signIn: handleSignIn,
    signUp: handleSignUp,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
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

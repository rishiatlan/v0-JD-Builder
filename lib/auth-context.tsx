"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { ErrorTracker } from "@/lib/error-tracking"

interface AuthState {
  user: any | null
  profile: any | null
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
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const router = useRouter()

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single()

          setAuthState({
            user: session.user,
            profile,
            isLoading: false,
            isAuthenticated: true,
          })
        } else {
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } catch (error) {
        ErrorTracker.captureError(error, { action: "initAuth" })
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        setAuthState({
          user: session.user,
          profile,
          isLoading: false,
          isAuthenticated: true,
        })

        // Log sign in event
        ErrorTracker.logEvent("user_signed_in", { userId: session.user.id })
      } else if (event === "SIGNED_OUT") {
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        })

        // Log sign out event
        ErrorTracker.logEvent("user_signed_out", {})
      }
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      return { success: true }
    } catch (error) {
      ErrorTracker.captureError(error, { action: "signIn", email })
      return { success: false, error: error.message || "Failed to sign in" }
    }
  }

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        throw error
      }

      // Create user profile
      if (data.user) {
        const { error: profileError } = await supabase.from("user_profiles").insert({
          user_id: data.user.id,
          full_name: metadata?.full_name || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (profileError) {
          console.error("Failed to create user profile:", profileError)
        }
      }

      return { success: true }
    } catch (error) {
      ErrorTracker.captureError(error, { action: "signUp", email })
      return { success: false, error: error.message || "Failed to sign up" }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      ErrorTracker.captureError(error, { action: "signOut" })
    }
  }

  const updateProfile = async (profile: any) => {
    try {
      if (!authState.user) {
        return { success: false, error: "Not authenticated" }
      }

      const { error } = await supabase
        .from("user_profiles")
        .update({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", authState.user.id)

      if (error) {
        throw error
      }

      // Update local state
      setAuthState((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          ...profile,
        },
      }))

      return { success: true }
    } catch (error) {
      ErrorTracker.captureError(error, { action: "updateProfile" })
      return { success: false, error: error.message || "Failed to update profile" }
    }
  }

  const contextValue: AuthContextType = {
    authState,
    signIn,
    signUp,
    signOut,
    updateProfile,
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

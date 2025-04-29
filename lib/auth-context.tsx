"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: any | null
  error: string | null
  debugInfo: string | null
}

interface AuthContextType {
  authState: AuthState
  sendMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
    debugInfo: null,
  })

  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setAuthState((prev) => ({ ...prev, debugInfo: "Checking for session..." }))

        // Check for Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          // We have a valid session
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            user: session.user,
            error: null,
            debugInfo: `Session found for user: ${session.user.email}`,
          })

          console.log("User is authenticated:", session.user.email)
        } else {
          // No valid session
          setAuthState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: null,
            debugInfo: "No session found",
          })

          console.log("No authenticated user")

          // If not on login page and not on auth callback, redirect to login
          if (pathname !== "/login" && !pathname.startsWith("/auth/callback")) {
            router.push("/login")
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: error instanceof Error ? error.message : "Authentication initialization failed",
          debugInfo: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        })
      }
    }

    initAuth()

    // Set up Supabase auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session ? "session exists" : "no session")
      setAuthState((prev) => ({ ...prev, debugInfo: `Auth event: ${event}` }))

      if (event === "SIGNED_IN" && session) {
        // User has signed in, update our state
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          user: session.user,
          error: null,
          debugInfo: `Signed in: ${session.user.email}`,
        })

        // Redirect to home if on login page
        if (pathname === "/login") {
          router.push("/")
        }
      } else if (event === "SIGNED_OUT") {
        // User has signed out, update our state
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
          debugInfo: "Signed out",
        })

        // Redirect to login
        router.push("/login")
      }
    })

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname, supabase.auth])

  const clearError = () => {
    setAuthState((prev) => ({ ...prev, error: null }))
  }

  const handleSendMagicLink = async (email: string) => {
    try {
      setAuthState((prev) => ({ ...prev, debugInfo: `Sending magic link to ${email}...` }))

      // Configure magic link to expire in 1 hour (3600 seconds)
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
          // Magic link expires in 1 hour
          emailLinkExpirationIn: 3600,
        },
      })

      if (error) {
        setAuthState((prev) => ({
          ...prev,
          error: error.message,
          debugInfo: `Error sending magic link: ${error.message}`,
        }))
        return { success: false, error: error.message }
      }

      setAuthState((prev) => ({ ...prev, debugInfo: `Magic link sent successfully to ${email}` }))
      return { success: true }
    } catch (error) {
      console.error("Send magic link error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to send magic link"
      setAuthState((prev) => ({
        ...prev,
        error: errorMessage,
        debugInfo: `Exception: ${errorMessage}`,
      }))
      return { success: false, error: errorMessage }
    }
  }

  const handleSignOut = async () => {
    try {
      setAuthState((prev) => ({ ...prev, debugInfo: "Signing out..." }))
      await supabase.auth.signOut()

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        debugInfo: "Signed out successfully",
      })

      router.push("/login")
      return { success: true }
    } catch (error) {
      console.error("Sign out error:", error)
      setAuthState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Sign out failed",
        debugInfo: `Sign out error: ${error instanceof Error ? error.message : "Unknown error"}`,
      }))
      return { success: false, error: "Failed to sign out" }
    }
  }

  const contextValue: AuthContextType = {
    authState,
    sendMagicLink: handleSendMagicLink,
    signOut: handleSignOut,
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

"use client"

import { createContext, useContext, type ReactNode } from "react"

// Define the authentication state type
export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: {
    id: string
    email: string
    full_name: string | null
  } | null
}

// Define the context type
interface AuthContextType {
  authState: AuthState
  signOut: () => Promise<void>
}

// Create the context with default values
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Default stub user - always authenticated
const stubUser = {
  id: "stub-user-id",
  email: "user@atlan.com",
  full_name: "Atlan User",
}

// Create a provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  // Stub authentication state - always authenticated
  const authState: AuthState = {
    isAuthenticated: true,
    isLoading: false,
    user: stubUser,
  }

  // Stub sign out function
  const signOut = async () => {
    console.log("Sign out called (stubbed)")
    // No actual sign out happens
  }

  return <AuthContext.Provider value={{ authState, signOut }}>{children}</AuthContext.Provider>
}

// Create a hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

"use client"

import { createContext, useContext, type ReactNode } from "react"

// Define the auth state type
interface AuthState {
  isAuthenticated: boolean
  user: {
    email: string
  } | null
  isLoading: boolean
}

// Define the auth context type
interface AuthContextType {
  authState: AuthState
}

// Create the auth context with default values
const AuthContext = createContext<AuthContextType>({
  authState: {
    isAuthenticated: true,
    user: {
      email: "demo@atlan.com",
    },
    isLoading: false,
  },
})

// Create the auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  // Always return authenticated state
  const authState: AuthState = {
    isAuthenticated: true,
    user: {
      email: "demo@atlan.com",
    },
    isLoading: false,
  }

  return <AuthContext.Provider value={{ authState }}>{children}</AuthContext.Provider>
}

// Create the useAuth hook
export function useAuth() {
  return useContext(AuthContext)
}

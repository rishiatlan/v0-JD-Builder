"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authState } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!authState.isLoading && !authState.isAuthenticated) {
      router.push("/login")
    }
  }, [authState.isLoading, authState.isAuthenticated, router])

  // Show loading state while checking authentication
  if (authState.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // If not authenticated and not loading, the useEffect will handle redirect
  // If authenticated, render children
  return authState.isAuthenticated ? <>{children}</> : null
}

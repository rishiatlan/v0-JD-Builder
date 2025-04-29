"use client"

import type React from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowUnauthenticated?: boolean
}

export function ProtectedRoute({ children, allowUnauthenticated = false }: ProtectedRouteProps) {
  const { authState } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!allowUnauthenticated && !authState.isLoading && !authState.isAuthenticated) {
      router.push("/login")
    }
  }, [authState.isLoading, authState.isAuthenticated, router, allowUnauthenticated])

  if (authState.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
      </div>
    )
  }

  if (!allowUnauthenticated && !authState.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
        <p className="text-slate-600 mb-6 max-w-md">
          You need to sign in with your @atlan.com email to access this feature.
        </p>
        <Button onClick={() => router.push("/login")} className="bg-atlan-primary hover:bg-atlan-primary-dark">
          Sign In
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

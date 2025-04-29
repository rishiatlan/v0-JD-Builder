"use client"

import type React from "react"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      router.push("/login")
    }
  }, [authState.isLoading, authState.isAuthenticated, router])

  if (authState.isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
      </div>
    )
  }

  if (!authState.isAuthenticated) {
    return null
  }

  return <>{children}</>
}

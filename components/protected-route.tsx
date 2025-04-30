"use client"

import type { ReactNode } from "react"

// Stub implementation of ProtectedRoute
export function ProtectedRoute({ children }: { children: ReactNode }) {
  // Always render children without protection
  return <>{children}</>
}

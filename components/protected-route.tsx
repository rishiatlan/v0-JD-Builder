"use client"

import type { ReactNode } from "react"

// This is now just a passthrough component since we're always authenticated
export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <>{children}</>
}

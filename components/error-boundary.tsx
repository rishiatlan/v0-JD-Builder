"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ErrorReporter } from "@/components/error-reporter"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [showReporter, setShowReporter] = useState(false)

  useEffect(() => {
    // Add global error handler
    const errorHandler = (event: ErrorEvent) => {
      console.error("Global error caught:", event.error)
      setError(event.error)
      setHasError(true)

      event.preventDefault()
    }

    window.addEventListener("error", errorHandler)

    return () => {
      window.removeEventListener("error", errorHandler)
    }
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg border border-red-200">
          {showReporter ? (
            <ErrorReporter onClose={() => setShowReporter(false)} />
          ) : (
            <>
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-center mb-2">Something went wrong</h2>
              <p className="text-slate-600 text-center mb-6">
                We've encountered an unexpected error. Please help us improve by reporting this issue.
              </p>
              <div className="space-y-4">
                <Button
                  className="w-full bg-atlan-primary hover:bg-atlan-primary-dark"
                  onClick={() => setShowReporter(true)}
                >
                  Report Issue
                </Button>
                <Button
                  className="w-full bg-atlan-primary hover:bg-atlan-primary-dark"
                  onClick={() => window.location.reload()}
                >
                  Reload Application
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-atlan-primary text-atlan-primary hover:bg-atlan-primary/10"
                  onClick={() => {
                    window.location.href = "/"
                  }}
                >
                  Return to Home
                </Button>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200">
                <details className="text-xs text-slate-500">
                  <summary className="cursor-pointer">Technical Details</summary>
                  <p className="mt-2 p-2 bg-slate-100 rounded overflow-auto">{error?.toString() || "Unknown error"}</p>
                </details>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}

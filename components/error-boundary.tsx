"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Error caught by error boundary:", event.error)
      setError(event.error)
      setHasError(true)
      // Prevent the error from propagating
      event.preventDefault()
    }

    window.addEventListener("error", handleError)

    return () => {
      window.removeEventListener("error", handleError)
    }
  }, [])

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center text-red-600 mb-4">
            <AlertCircle className="h-6 w-6 mr-2" />
            <h2 className="text-xl font-semibold">Something went wrong</h2>
          </div>

          <p className="text-slate-600 mb-4">
            We encountered an error while loading the application. This might be due to a configuration issue.
          </p>

          {error && (
            <div className="bg-red-50 p-3 rounded-md mb-4 text-sm text-red-800 overflow-auto max-h-32">
              {error.message}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setHasError(false)
                setError(null)
                window.location.reload()
              }}
              className="bg-atlan-primary hover:bg-atlan-primary-dark"
            >
              Reload Application
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

"use client"

import React from "react"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("Error caught by boundary:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
          <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">
              We apologize for the inconvenience. An error occurred while processing your request.
            </p>
            {this.state.error && (
              <div className="bg-red-50 p-3 rounded mb-4 text-sm text-red-800 font-mono overflow-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex gap-4">
              <Button onClick={() => (window.location.href = "/")} variant="outline">
                Go to Home
              </Button>
              <Button onClick={() => window.location.reload()} variant="default">
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function ErrorBoundaryWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    window.addEventListener("error", (event) => {
      console.error("Global error caught:", event.error)
    })

    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled promise rejection:", event.reason)
    })

    return () => {
      window.removeEventListener("error", () => {})
      window.removeEventListener("unhandledrejection", () => {})
    }
  }, [])

  return <ErrorBoundary>{children}</ErrorBoundary>
}

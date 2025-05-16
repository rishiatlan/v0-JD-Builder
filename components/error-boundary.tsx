"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  showResetButton?: boolean
  showHomeButton?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorCount: number
  lastErrorTime: number
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo)

    // Update error count and time
    this.setState((prevState) => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
      lastErrorTime: Date.now(),
    }))

    // Call onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to analytics or error tracking service
    this.logErrorToService(error, errorInfo)
  }

  componentDidUpdate(prevProps: Props): void {
    // Reset the error boundary when props change if resetOnPropsChange is true
    if (this.state.hasError && this.props.resetOnPropsChange && prevProps !== this.props) {
      this.resetErrorBoundary()
    }
  }

  // Log error to an external service
  logErrorToService(error: Error, errorInfo: ErrorInfo): void {
    // In a real app, you would send this to your error tracking service
    // Example: Sentry.captureException(error)

    // For now, just log to console with additional context
    console.group("Error Details for Tracking")
    console.error("Error:", error.message)
    console.error("Stack:", error.stack)
    console.error("Component Stack:", errorInfo.componentStack)
    console.error("Error Count:", this.state.errorCount)
    console.error("Browser:", navigator.userAgent)
    console.error("URL:", window.location.href)
    console.error("Time:", new Date().toISOString())
    console.groupEnd()
  }

  resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Check if we should show a custom fallback
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Check if we're experiencing repeated errors in a short time
      const isRepeatedError = this.state.errorCount > 3 && Date.now() - this.state.lastErrorTime < 60000

      // Default error UI
      return (
        <div className="p-6 max-w-md mx-auto my-8 bg-white rounded-lg shadow-md">
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle className="text-lg font-semibold">
              {isRepeatedError ? "Persistent Error Detected" : "Something went wrong"}
            </AlertTitle>
            <AlertDescription>
              {isRepeatedError
                ? "We're experiencing multiple errors. This might indicate a more serious problem."
                : "An unexpected error occurred while rendering this component."}
            </AlertDescription>
          </Alert>

          {this.state.error && (
            <div className="mb-4 p-3 bg-red-50 rounded text-sm overflow-auto max-h-32">
              <p className="font-mono text-red-700">{this.state.error.toString()}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {this.props.showResetButton !== false && (
              <Button onClick={this.resetErrorBoundary} className="flex items-center">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}

            {this.props.showHomeButton !== false && (
              <Link href="/" passHref>
                <Button variant="outline" className="flex items-center">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </Link>
            )}

            {isRepeatedError && (
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-2 sm:mt-0">
                Reload Page
              </Button>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

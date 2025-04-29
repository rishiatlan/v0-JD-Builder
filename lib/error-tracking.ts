import { supabase } from "@/lib/supabase"

interface ErrorDetails {
  message: string
  stack?: string
  context?: Record<string, any>
  userEmail?: string
}

export class ErrorTracker {
  static async captureError(error: Error | string, context?: Record<string, any>, userEmail?: string) {
    try {
      const errorMessage = typeof error === "string" ? error : error.message
      const errorStack = typeof error === "string" ? undefined : error.stack

      // Log to console first (for development and immediate visibility)
      console.error("Error captured:", errorMessage, errorStack, context)

      // Send to API endpoint for logging and email notification
      const response = await fetch("/api/error", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          errorMessage,
          errorStack,
          context,
          userEmail,
        }),
      })

      if (!response.ok) {
        console.error("Failed to log error to server:", await response.text())
      }

      return response.ok
    } catch (loggingError) {
      // Fallback if error logging itself fails
      console.error("Error during error logging:", loggingError)
      return false
    }
  }

  static async logEvent(eventType: string, details: Record<string, any>) {
    try {
      // Log analytics event to Supabase
      const { error } = await supabase.from("analytics_events").insert({
        user_id: null,
        event_type: eventType,
        properties: details,
        session_id: this.getSessionId(),
      })

      if (error) {
        console.error("Failed to log analytics event:", error)
      }
    } catch (error) {
      console.error("Error logging analytics event:", error)
    }
  }

  private static getSessionId(): string {
    if (typeof window === "undefined") return "server-side"

    // Get or create session ID from localStorage
    let sessionId = localStorage.getItem("atlan_session_id")

    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      localStorage.setItem("atlan_session_id", sessionId)
    }

    return sessionId
  }
}

// Global error handler for unhandled exceptions
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    ErrorTracker.captureError(event.error || event.message, {
      source: "window.onerror",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    })
  })

  window.addEventListener("unhandledrejection", (event) => {
    ErrorTracker.captureError(event.reason || "Unhandled Promise Rejection", {
      source: "unhandledrejection",
      promise: event.promise,
    })
  })
}

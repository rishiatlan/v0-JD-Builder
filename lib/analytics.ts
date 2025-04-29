import { supabase } from "@/lib/supabase"

type EventType =
  | "page_view"
  | "jd_generation_started"
  | "jd_generation_completed"
  | "jd_generation_failed"
  | "document_upload"
  | "document_parse_success"
  | "document_parse_failed"
  | "refinement_applied"
  | "jd_downloaded"
  | "user_signed_in"
  | "user_signed_out"
  | "error"

interface AnalyticsEvent {
  event: EventType
  properties?: Record<string, any>
  timestamp?: number
}

class AnalyticsService {
  private initialized = false
  private userId: string | null = null
  private sessionId: string | null = null
  private eventQueue: AnalyticsEvent[] = []
  private flushInterval: NodeJS.Timeout | null = null

  constructor() {
    // Initialize session ID
    this.sessionId = this.generateId()
  }

  public async init(userId?: string): Promise<void> {
    if (this.initialized) return

    this.initialized = true
    this.userId = userId || this.generateAnonymousId()

    // Set up event flushing
    this.flushInterval = setInterval(() => this.flush(), 30000) // Flush every 30 seconds

    // Flush events on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush())
    }

    console.log("Analytics initialized", { userId: this.userId, sessionId: this.sessionId })
  }

  public identify(userId: string, traits?: Record<string, any>): void {
    this.userId = userId

    // Log user identification to Supabase
    this.track("user_identified", { userId, traits })
  }

  public async track(event: EventType, properties?: Record<string, any>): Promise<void> {
    if (!this.initialized) {
      await this.init()
    }

    const eventData: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
    }

    this.eventQueue.push(eventData)

    // For development, log events immediately
    console.log("Analytics event tracked", eventData)

    // In production, you might want to batch events
    if (this.eventQueue.length >= 10) {
      await this.flush()
    }
  }

  public async page(pageName: string, properties?: Record<string, any>): Promise<void> {
    await this.track("page_view", {
      page: pageName,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      ...properties,
    })
  }

  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      // Get current user if available
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Insert events into Supabase
      for (const event of events) {
        await supabase.from("analytics_events").insert({
          user_id: user?.id || null,
          event_type: event.event,
          properties: event.properties || {},
          session_id: this.sessionId,
          created_at: new Date(event.timestamp || Date.now()).toISOString(),
        })
      }

      console.log("Analytics events flushed to Supabase", { count: events.length })
    } catch (error) {
      console.error("Error flushing analytics events to Supabase:", error)
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  private generateAnonymousId(): string {
    // Try to get from localStorage first
    if (typeof window !== "undefined" && window.localStorage) {
      const storedId = localStorage.getItem("atlan_anonymous_id")
      if (storedId) return storedId

      const newId = this.generateId()
      localStorage.setItem("atlan_anonymous_id", newId)
      return newId
    }

    return this.generateId()
  }

  public cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flush().catch(console.error)
  }
}

// Export singleton instance
export const analytics = new AnalyticsService()

// Helper hook for React components
export function useAnalytics() {
  return analytics
}

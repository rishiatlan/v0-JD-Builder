export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      job_descriptions: {
        Row: {
          id: string
          title: string
          department: string
          content: Json
          user_email: string | null
          created_at: string
          updated_at: string
          is_template: boolean
          is_public: boolean
          status: string
        }
        Insert: {
          id?: string
          title: string
          department: string
          content: Json
          user_email?: string | null
          created_at?: string
          updated_at?: string
          is_template?: boolean
          is_public?: boolean
          status?: string
        }
        Update: {
          id?: string
          title?: string
          department?: string
          content?: Json
          user_email?: string | null
          created_at?: string
          updated_at?: string
          is_template?: boolean
          is_public?: boolean
          status?: string
        }
      }
      user_history: {
        Row: {
          id: string
          user_email: string | null
          action: string
          resource_type: string
          resource_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_email?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_email?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      error_logs: {
        Row: {
          id: string
          user_email: string | null
          error_message: string
          error_stack: string | null
          context: Json | null
          created_at: string
          status: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          user_email?: string | null
          error_message: string
          error_stack?: string | null
          context?: Json | null
          created_at?: string
          status?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          user_email?: string | null
          error_message?: string
          error_stack?: string | null
          context?: Json | null
          created_at?: string
          status?: string
          resolved_at?: string | null
        }
      }
      analytics_events: {
        Row: {
          id: string
          user_email: string | null
          event_type: string
          properties: Json | null
          session_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_email?: string | null
          event_type: string
          properties?: Json | null
          session_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_email?: string | null
          event_type?: string
          properties?: Json | null
          session_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

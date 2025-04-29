import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  )
}

if (!isBrowser && !supabaseServiceKey) {
  console.error("Missing Supabase service role key. Please set SUPABASE_SERVICE_ROLE_KEY for server-side operations.")
}

// Create a Supabase client for anonymous access (client-side)
export const supabase = createClient<Database>(supabaseUrl || "", supabaseAnonKey || "")

// Create a Supabase admin client with service role key (server-side only)
export const supabaseAdmin = !isBrowser ? createClient<Database>(supabaseUrl || "", supabaseServiceKey || "") : null

// Helper function to ensure we're on the server when using admin privileges
export function getSupabaseAdmin() {
  if (isBrowser) {
    throw new Error("getSupabaseAdmin can only be used on the server")
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    )
  }

  return supabaseAdmin
}

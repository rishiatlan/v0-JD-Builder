import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

// Create a service role client for admin operations (server-side only)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

// Helper function to get authenticated client (server-side)
export const getServiceSupabase = () => supabaseAdmin

// Helper function to check if user is authenticated
export async function isAuthenticated() {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return !!session
}

// Helper function to get current user
export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

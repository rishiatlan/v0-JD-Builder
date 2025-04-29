import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Create a single instance of the Supabase client for browser usage
export const supabase = createClientComponentClient<Database>()

// Export this single instance to be used throughout the application

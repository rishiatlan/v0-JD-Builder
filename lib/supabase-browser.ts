"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Create a single instance of the Supabase client for the browser
export const supabaseBrowser = createClientComponentClient<Database>()

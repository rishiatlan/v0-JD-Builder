"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase-client"

// This component helps identify if multiple Supabase clients are being created
export function SupabaseDebug() {
  useEffect(() => {
    // Add a unique identifier to this client instance
    console.log("Supabase client initialized with ID:", Math.random().toString(36).substring(7))

    // Log when auth state changes
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed in SupabaseDebug:", event, session ? "session exists" : "no session")
    })

    return () => {
      data.subscription.unsubscribe()
    }
  }, [])

  return null
}

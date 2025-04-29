"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase-client"

export function SupabaseAuthListener() {
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session ? "session exists" : "no session")

      // Optionally refresh page on login/logout
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        console.log(`User ${event === "SIGNED_IN" ? "signed in" : "signed out"}, refreshing...`)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return null
}

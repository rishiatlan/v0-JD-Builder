"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"

export function SupabaseAuthListener() {
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session ? "session exists" : "no session")

      if (event === "SIGNED_IN") {
        console.log("User signed in, refreshing...")
        // Force a router refresh to update the UI
        router.refresh()
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out, redirecting to login...")
        // Redirect to login page
        window.location.href = "/login"
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return null
}

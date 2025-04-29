"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for code in query string (from Supabase auth redirect)
        const code = searchParams.get("code")

        if (!code) {
          setError("Missing authentication code. Please try again.")
          setTimeout(() => router.push("/login"), 3000)
          return
        }

        setDebugInfo("Processing authentication...")
        console.log("Auth callback: Processing code")

        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error("Auth callback: Code exchange failed", exchangeError)
          throw exchangeError
        }

        if (!data.session) {
          console.error("Auth callback: No session created")
          throw new Error("Failed to establish session")
        }

        console.log("Auth callback: Session established for", data.session.user.email)
        setDebugInfo(`Authentication successful for ${data.session.user.email}`)

        // Force a full page reload to ensure the session is recognized everywhere
        window.location.href = "/"
      } catch (err: any) {
        console.error("Auth callback error:", err)
        setError(err.message || "Authentication failed")
        setTimeout(() => router.push("/login"), 3000)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center">
        {error ? (
          <>
            <h1 className="text-xl font-semibold text-red-600 mb-2">Authentication Error</h1>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirecting you to login...</p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Signing you in</h1>
            <p className="text-gray-600">Please wait while we complete the authentication process...</p>
          </>
        )}

        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-left">
            <p className="text-xs text-gray-500 font-mono whitespace-pre-wrap">{debugInfo}</p>
          </div>
        )}
      </div>
    </div>
  )
}

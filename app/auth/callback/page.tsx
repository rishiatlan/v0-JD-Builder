"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  useEffect(() => {
    async function handleAuth() {
      // This should be looking for 'code', not 'token'
      const code = searchParams.get("code")

      if (code) {
        console.log("Auth callback: Processing code")
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error("Error exchanging code:", error.message)
            setError(error.message)
            setTimeout(() => router.push("/login?error=auth_failed"), 3000)
          } else {
            console.log("Session successfully established for:", data.session?.user.email)
            // Force a full page reload to ensure the session is recognized everywhere
            window.location.href = "/"
          }
        } catch (err: any) {
          console.error("Auth callback error:", err)
          setError(err.message || "Authentication failed")
          setTimeout(() => router.push("/login?error=auth_exception"), 3000)
        }
      } else {
        console.error("No code found in URL")
        setError("No authentication code found in URL")
        setTimeout(() => router.push("/login?error=missing_code"), 3000)
      }
      setIsProcessing(false)
    }

    handleAuth()
  }, [searchParams, router])

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
      </div>
    </div>
  )
}

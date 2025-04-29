"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw } from "lucide-react"

export default function AuthDebugPage() {
  const [loading, setLoading] = useState(true)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const fetchAuthInfo = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        throw sessionError
      }

      setSessionInfo(sessionData.session)

      // Get user
      if (sessionData.session) {
        const { data: userData, error: userError } = await supabase.auth.getUser()

        if (userError) {
          throw userError
        }

        setUserInfo(userData.user)
      } else {
        setUserInfo(null)
      }
    } catch (err: any) {
      console.error("Auth debug error:", err)
      setError(err.message || "Failed to fetch authentication information")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuthInfo()
  }, [])

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>

      <div className="mb-4">
        <Button onClick={fetchAuthInfo} variant="outline" disabled={loading} className="flex items-center">
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
          Refresh Auth Info
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : sessionInfo ? (
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(sessionInfo, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No active session found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : userInfo ? (
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
                {JSON.stringify(userInfo, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">No authenticated user found</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">Browser Information</h2>
        <Card>
          <CardContent className="pt-6">
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-xs">
              {`User Agent: ${typeof window !== "undefined" ? window.navigator.userAgent : "Not available"}\n`}
              {`Cookies Enabled: ${typeof window !== "undefined" ? window.navigator.cookieEnabled : "Not available"}\n`}
              {`Local Storage Available: ${typeof window !== "undefined" && window.localStorage ? "Yes" : "No"}\n`}
              {`Current URL: ${typeof window !== "undefined" ? window.location.href : "Not available"}`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

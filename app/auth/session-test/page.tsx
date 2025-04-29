"use client"

import { useEffect, useState } from "react"
import { supabaseBrowser } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"

export default function SessionTestPage() {
  const [sessionData, setSessionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkSession = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabaseBrowser.auth.getSession()

      if (error) throw error

      setSessionData(data)
      console.log("Session data:", data)
    } catch (err: any) {
      setError(err.message)
      console.error("Session check error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkSession()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Session Test</h1>

      <div className="mb-4">
        <Button onClick={checkSession} disabled={loading}>
          {loading ? "Checking..." : "Check Session"}
        </Button>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Session Data:</h2>
        <pre className="whitespace-pre-wrap overflow-auto">
          {sessionData ? JSON.stringify(sessionData, null, 2) : "No session data"}
        </pre>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Local Storage:</h2>
        <Button
          onClick={() => {
            const items = { ...localStorage }
            console.log("Local Storage:", items)
            alert(JSON.stringify(items, null, 2))
          }}
        >
          Check Local Storage
        </Button>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Cookies:</h2>
        <pre className="bg-gray-100 p-4 rounded">{document.cookie || "No cookies"}</pre>
      </div>
    </div>
  )
}

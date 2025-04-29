"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"

export default function SessionTestPage() {
  const [session, setSession] = useState<any>(null)
  const [cookies, setCookies] = useState<string>("")
  const [localStorage, setLocalStorage] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      try {
        // Get session
        const { data } = await supabase.auth.getSession()
        setSession(data.session)

        // Get cookies
        setCookies(document.cookie)

        // Get localStorage items related to Supabase
        const localStorageItems: Record<string, string> = {}
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)
          if (key && (key.includes("supabase") || key.includes("sb-"))) {
            localStorageItems[key] = window.localStorage.getItem(key) || ""
          }
        }
        setLocalStorage(localStorageItems)
      } catch (error) {
        console.error("Error checking session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [])

  if (isLoading) {
    return <div className="p-8">Loading session information...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Session Test</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Session Status</h2>
        {session ? (
          <div className="bg-green-100 p-4 rounded">
            <p className="text-green-800">✅ Authenticated as {session.user.email}</p>
          </div>
        ) : (
          <div className="bg-red-100 p-4 rounded">
            <p className="text-red-800">❌ Not authenticated</p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Session Details</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
          {JSON.stringify(session, null, 2) || "No session found"}
        </pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Cookies</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">{cookies || "No cookies found"}</pre>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Local Storage (Supabase related)</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
          {Object.keys(localStorage).length > 0
            ? JSON.stringify(localStorage, null, 2)
            : "No Supabase items in localStorage"}
        </pre>
      </div>

      <div className="mt-8">
        <button
          onClick={async () => {
            await supabase.auth.signOut()
            window.location.reload()
          }}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

export function EnvironmentVariablesCheck() {
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<any>(null)

  const checkEnvironmentVariables = async () => {
    setChecking(true)
    try {
      const response = await fetch("/api/db/check")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Error checking environment variables",
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={checkEnvironmentVariables} disabled={checking}>
        {checking ? "Checking..." : "Check Environment Variables"}
      </Button>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>
            {result.message}
            {result.missingVars && (
              <div className="mt-2">
                <p>Missing environment variables:</p>
                <ul className="list-disc pl-5">
                  {Object.entries(result.missingVars).map(([key, missing]) => missing && <li key={key}>{key}</li>)}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

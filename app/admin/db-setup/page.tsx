"use client"

import { useState } from "react"
import { AtlanHeader } from "@/components/atlan-header"
import { AtlanFooter } from "@/components/atlan-footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { runMigration } from "@/app/actions/db-setup"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DbSetupPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)
  const { toast } = useToast()

  const handleRunMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const result = await runMigration()
      setResult(result)

      if (result.success) {
        toast({
          title: "Migration successful",
          description: "The database migration was completed successfully.",
        })
      } else {
        toast({
          title: "Migration failed",
          description: result.error || "An error occurred during migration.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Migration error:", error)
      setResult({ success: false, error: error.message })
      toast({
        title: "Migration failed",
        description: "An unexpected error occurred during migration.",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AtlanHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Database Setup</CardTitle>
              <CardDescription>Run database migrations to set up or update the database schema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-slate-100 p-4 rounded-md">
                <h3 className="font-medium mb-2">Migration: Add Password Reset</h3>
                <p className="text-sm text-slate-700 mb-4">
                  This migration adds password reset functionality and updates the job descriptions table to track
                  ownership by email. It also creates a user activity table to track user actions.
                </p>
                <Button
                  onClick={handleRunMigration}
                  disabled={isRunning}
                  className="bg-atlan-primary hover:bg-atlan-primary-dark"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Migration
                    </>
                  ) : (
                    "Run Migration"
                  )}
                </Button>
              </div>

              {result && (
                <Alert variant={result.success ? "default" : "destructive"}>
                  {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                  <AlertDescription>
                    {result.success
                      ? "The database migration was completed successfully."
                      : result.error || "An error occurred during migration."}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <AtlanFooter />
    </div>
  )
}

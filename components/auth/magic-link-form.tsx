"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function MagicLinkForm() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { sendMagicLink } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validate email domain
      if (!email.trim().endsWith("@atlan.com")) {
        setError("Only @atlan.com email addresses are allowed")
        setIsSubmitting(false)
        return
      }

      const result = await sendMagicLink(email.trim())

      if (result.success) {
        setEmailSent(true)
      } else {
        setError(result.error || "Failed to send magic link. Please try again.")
      }
    } catch (err) {
      console.error("Magic link error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (emailSent) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Magic Link Sent!</h3>
        <p className="text-slate-600 mb-6">
          We've sent a magic link to <strong>{email}</strong>. Please check your inbox and click the link to sign in.
        </p>
        <p className="text-sm text-slate-500">
          Don't see the email? Check your spam folder or{" "}
          <button onClick={() => setEmailSent(false)} className="text-atlan-primary hover:underline font-medium">
            try again
          </button>
          .
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.name@atlan.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full"
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <Alert variant="destructive" className="text-sm">
          <AlertCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full bg-atlan-primary hover:bg-atlan-primary-dark" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send Magic Link"
        )}
      </Button>
    </form>
  )
}

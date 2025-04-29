"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { AtlanLogo } from "@/components/atlan-logo"

export function MagicLinkForm() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const { sendMagicLink, authState, clearError } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    clearError()

    try {
      // Validate email domain
      if (!email.endsWith("@atlan.com")) {
        throw new Error("Please use your @atlan.com email address")
      }

      const result = await sendMagicLink(email)

      if (result.success) {
        setIsSuccess(true)
      } else {
        throw new Error(result.error || "Failed to send magic link")
      }
    } catch (error: any) {
      console.error("Magic link submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {isSuccess ? (
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-4">
            <AtlanLogo className="h-12 w-auto" />
          </div>
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-slate-600">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-slate-500">The link will expire in 1 hour. Click the link to sign in.</p>

          <div className="mt-6">
            <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="text-xs">
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
              {showDebug ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>

            {showDebug && authState.debugInfo && (
              <div className="mt-2 p-3 bg-gray-100 rounded text-left">
                <p className="text-xs text-gray-500 font-mono whitespace-pre-wrap">{authState.debugInfo}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
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
              autoComplete="email"
            />
          </div>

          {authState.error && (
            <div className="bg-red-50 p-3 rounded flex items-start">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-600">{authState.error}</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Magic Link"
            )}
          </Button>

          <p className="text-xs text-slate-500 text-center mt-4">
            A magic link will be sent to your email. The link will expire in 1 hour.
          </p>

          <div className="mt-6">
            <Button variant="outline" size="sm" onClick={() => setShowDebug(!showDebug)} className="text-xs">
              {showDebug ? "Hide Debug Info" : "Show Debug Info"}
              {showDebug ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>

            {showDebug && authState.debugInfo && (
              <div className="mt-2 p-3 bg-gray-100 rounded text-left">
                <p className="text-xs text-gray-500 font-mono whitespace-pre-wrap">{authState.debugInfo}</p>
              </div>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

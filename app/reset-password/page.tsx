"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Lock, CheckCircle, X, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { AtlanLogo } from "@/components/atlan-logo"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null)
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function checkSession() {
      setIsLoading(true)

      try {
        // Check if we have a valid session from the auth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Session error:", error)
          setError("Unable to verify your session. Please try requesting a new password reset link.")
          setHasValidSession(false)
        } else if (data.session) {
          // We have a valid session from the auth callback
          setHasValidSession(true)
        } else {
          setError("No active session found. Please request a new password reset link.")
          setHasValidSession(false)
        }
      } catch (err) {
        console.error("Error checking session:", err)
        setError("An unexpected error occurred. Please try again.")
        setHasValidSession(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkSession()
  }, [supabase.auth])

  useEffect(() => {
    // Check password requirements
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }
    setPasswordRequirements(requirements)

    // Calculate password strength
    const metRequirements = Object.values(requirements).filter(Boolean).length
    if (metRequirements <= 2) {
      setPasswordStrength("weak")
    } else if (metRequirements <= 4) {
      setPasswordStrength("medium")
    } else {
      setPasswordStrength("strong")
    }
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords don't match")
      return
    }

    if (passwordStrength === "weak") {
      setError("Please choose a stronger password")
      return
    }

    setIsSubmitting(true)

    try {
      // Use the Supabase client to update the password directly
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw updateError
      }

      setIsSubmitted(true)
      toast({
        title: "Success",
        description: "Your password has been reset successfully.",
      })

      // Sign out after successful password reset
      await supabase.auth.signOut()

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (error: any) {
      console.error("Password reset error:", error)
      setError(error.message || "An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "bg-red-500"
      case "medium":
        return "bg-yellow-500"
      case "strong":
        return "bg-green-500"
      default:
        return "bg-slate-200"
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-8">
        <AtlanLogo />
      </div>

      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6">Set New Password</h1>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !hasValidSession && !isSubmitted ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center py-4">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Invalid Reset Link</h3>
              <p className="text-center text-slate-600">
                {error || "The password reset link is invalid or has expired."}
              </p>
            </div>

            <Button
              className="w-full bg-primary hover:bg-primary/90 text-white"
              onClick={() => router.push("/forgot-password")}
            >
              Request New Reset Link
            </Button>
          </div>
        ) : hasValidSession && !isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-md bg-red-50 text-red-700 text-sm flex items-start"
              >
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>

              {password && (
                <>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`h-2 flex-1 rounded-full ${getStrengthColor()}`}></div>
                    <span className="text-xs font-medium capitalize">{passwordStrength || "weak"}</span>
                  </div>
                  <div className="mt-3 space-y-1 bg-slate-50 p-3 rounded-md">
                    <p className="text-xs font-medium">Password requirements:</p>
                    <ul className="text-xs space-y-1">
                      <li className="flex items-center">
                        {passwordRequirements.length ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-1" />
                        )}
                        At least 8 characters
                      </li>
                      <li className="flex items-center">
                        {passwordRequirements.uppercase ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-1" />
                        )}
                        At least one uppercase letter
                      </li>
                      <li className="flex items-center">
                        {passwordRequirements.lowercase ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-1" />
                        )}
                        At least one lowercase letter
                      </li>
                      <li className="flex items-center">
                        {passwordRequirements.number ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-1" />
                        )}
                        At least one number
                      </li>
                      <li className="flex items-center">
                        {passwordRequirements.special ? (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <X className="h-3 w-3 text-red-500 mr-1" />
                        )}
                        At least one special character
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>

              {password && confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords don't match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white"
              disabled={isSubmitting || password !== confirmPassword || passwordStrength === "weak"}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        ) : (
          isSubmitted && (
            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center py-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Password Reset Successful</h3>
                <p className="text-center text-slate-600">
                  Your password has been reset successfully. You will be redirected to the login page in a few seconds.
                </p>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={() => router.push("/login")}
              >
                Go to Login
              </Button>
            </div>
          )
        )}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{" "}
          <Link href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

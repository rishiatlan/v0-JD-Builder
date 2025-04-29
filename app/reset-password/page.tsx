"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { EnhancedHeader } from "@/components/enhanced-header"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { confirmPasswordReset } from "@/app/actions/auth-actions"
import { Loader2, Lock, CheckCircle, X, AlertCircle, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

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
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Supabase sends the token as a hash parameter (#access_token=...)
    // We need to check both the searchParams and the hash
    const urlToken = searchParams.get("token")

    // Check if we have a hash in the URL (Supabase auth redirect)
    if (typeof window !== "undefined") {
      const hash = window.location.hash
      if (hash && hash.includes("access_token=")) {
        // Extract the token from the hash
        const hashParams = new URLSearchParams(hash.substring(1))
        const accessToken = hashParams.get("access_token")
        if (accessToken) {
          setToken(accessToken)
          return
        }
      }
    }

    if (urlToken) {
      setToken(urlToken)
    } else {
      setError("The password reset link is invalid or has expired.")
    }
  }, [searchParams])

  useEffect(() => {
    if (!token && !error) {
      setError("The password reset link is invalid or has expired.")
      toast({
        title: "Invalid reset link",
        description: "The password reset link is invalid or has expired.",
        variant: "destructive",
      })
    }
  }, [token, toast, error])

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
      if (!token) {
        throw new Error("Reset token is missing")
      }

      const { success, error } = await confirmPasswordReset(token, password)

      if (success) {
        setIsSubmitted(true)
        toast({
          title: "Success",
          description: "Your password has been reset successfully.",
        })

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login")
        }, 3000)
      } else {
        setError(error || "Failed to reset password. The link may have expired.")
        toast({
          title: "Error",
          description: error || "Failed to reset password. The link may have expired.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Password reset error:", error)
      setError("An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
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
    <div className="min-h-screen flex flex-col">
      <EnhancedHeader />

      <main className="flex-grow flex items-center justify-center py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
              <p className="text-slate-600">Create a new secure password for your account</p>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-8">
              {error && !token && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Invalid Reset Link</h3>
                    <p className="text-center text-slate-600">The password reset link is invalid or has expired.</p>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    onClick={() => router.push("/forgot-password")}
                  >
                    Request New Reset Link
                  </Button>
                </div>
              )}

              {token && !isSubmitted && (
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
                    <Label htmlFor="password" className="text-sm font-medium">
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
                    <Label htmlFor="confirmPassword" className="text-sm font-medium">
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
              )}

              {isSubmitted && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Password Reset Successful</h3>
                    <p className="text-center text-slate-600">
                      Your password has been reset successfully. You will be redirected to the login page in a few
                      seconds.
                    </p>
                  </div>

                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    onClick={() => router.push("/login")}
                  >
                    Go to Login
                  </Button>
                </div>
              )}
            </div>

            <div className="text-center mt-6">
              <Link href="/login" className="inline-flex items-center text-primary hover:underline">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to login
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  )
}

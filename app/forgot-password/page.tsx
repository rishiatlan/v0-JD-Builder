"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { EnhancedHeader } from "@/components/enhanced-header"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { resetPassword } from "@/app/actions/auth-actions"
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react"
import { motion } from "framer-motion"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { success, error } = await resetPassword(email)

      if (success) {
        setIsSubmitted(true)
        toast({
          title: "Reset link sent",
          description: "Please check your email for instructions to reset your password.",
        })
      } else {
        toast({
          title: "Error",
          description: error || "Failed to send password reset email. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Password reset error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
              <h1 className="text-3xl font-bold mb-2">Reset Your Password</h1>
              <p className="text-slate-600">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-soft p-8">
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send Reset Link"
                    )}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Check your inbox</h3>
                    <p className="text-center text-slate-600">
                      We've sent a password reset link to <span className="font-medium">{email}</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-sm text-center text-slate-500">
                      Didn't receive an email? Check your spam folder or try again.
                    </p>
                    <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                      Try again
                    </Button>
                  </div>
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

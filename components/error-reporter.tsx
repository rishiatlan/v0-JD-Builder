"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ErrorTracker } from "@/lib/error-tracking"

interface ErrorReporterProps {
  onClose: () => void
}

export function ErrorReporter({ onClose }: ErrorReporterProps) {
  const [email, setEmail] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate email
      if (!email || !email.includes("@")) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Send error report
      await ErrorTracker.captureError(
        "User reported issue",
        {
          description,
          reportType: "user_reported",
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
        email,
      )

      toast({
        title: "Report Sent",
        description: "Thank you for your feedback. We'll look into this issue.",
      })

      // Close the reporter
      onClose()
    } catch (error) {
      console.error("Failed to submit error report:", error)
      toast({
        title: "Error",
        description: "Failed to submit your report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          Report an Issue
        </CardTitle>
        <CardDescription>
          Please provide details about the problem you encountered. We'll get back to you as soon as possible.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Your Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Issue Description</Label>
            <Textarea
              id="description"
              placeholder="Please describe what happened..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>
          <Button type="submit" className="w-full bg-atlan-primary hover:bg-atlan-primary-dark" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Report"}
            <Send className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </CardFooter>
    </Card>
  )
}

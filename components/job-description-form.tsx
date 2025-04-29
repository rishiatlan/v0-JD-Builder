"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { saveJobDescription } from "@/app/actions/saveJobDescription"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth-context"

export interface JobDescriptionFormProps {
  initialData?: {
    id?: string
    title: string
    department: string
    content: any
  }
  onSuccess?: (data: any) => void
}

// Add named export alongside default export
export function JobDescriptionForm({ initialData, onSuccess }: JobDescriptionFormProps) {
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    id: initialData?.id || undefined,
    title: initialData?.title || "",
    department: initialData?.department || "",
    content: initialData?.content || {},
  })
  const { toast } = useToast()
  const { authState } = useAuth()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Prepare the data for saving
      const jdData = {
        ...formData,
        user_email: authState.user?.email || null,
        is_public: true, // Make it public by default
      }

      const result = await saveJobDescription(jdData)

      if (result.success) {
        toast({
          title: "Success",
          description: `Job description ${initialData ? "updated" : "saved"} successfully!`,
        })

        if (onSuccess) {
          onSuccess(result.data)
        }
      } else {
        throw new Error(result.error || "Failed to save job description")
      }
    } catch (error) {
      console.error("Error saving job description:", error)
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-atlan-primary">
          {initialData ? "Edit Job Description" : "Create New Job Description"}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Senior Data Engineer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g., Engineering, Marketing, Sales"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Job Description</Label>
            <Textarea
              id="content"
              name="content"
              value={
                typeof formData.content === "string" ? formData.content : JSON.stringify(formData.content, null, 2)
              }
              onChange={handleChange}
              placeholder="Enter job description details..."
              className="min-h-[200px]"
              required
            />
            <p className="text-sm text-muted-foreground">
              You can enter plain text or JSON format for structured content.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          <Button type="submit" className="bg-atlan-primary hover:bg-atlan-primary-dark" disabled={saving}>
            {saving ? "Saving..." : initialData ? "Update" : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

// Keep the default export as well
export default JobDescriptionForm

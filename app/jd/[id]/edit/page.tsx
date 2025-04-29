"use client"

import { useState, useEffect } from "react"
import { AtlanHeader } from "@/components/atlan-header"
import { AtlanFooter } from "@/components/atlan-footer"
import JobDescriptionForm from "@/components/job-description-form"
import { useRouter } from "next/navigation"
import { JDService } from "@/lib/jd-service"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"

export default function EditJobDescriptionPage({ params }: { params: { id: string } }) {
  const [jdData, setJdData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const loadJD = async () => {
      try {
        const { success, data, error } = await JDService.getJD(params.id)
        if (success && data) {
          setJdData(data)
        } else {
          toast({
            title: "Error",
            description: error || "Failed to load job description",
            variant: "destructive",
          })
          router.push("/history")
        }
      } catch (error) {
        console.error("Error loading JD:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        })
        router.push("/history")
      } finally {
        setLoading(false)
      }
    }

    loadJD()
  }, [params.id, router, toast])

  const handleSuccess = (data: any) => {
    // Redirect to the JD view page
    router.push(`/jd/${params.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <AtlanHeader />
        <main className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
        </main>
        <AtlanFooter />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <AtlanHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-atlan-primary mb-8">Edit Job Description</h1>
          <p className="text-center text-slate-600 max-w-3xl mx-auto mb-12">
            Update your job description details below.
          </p>

          {jdData && <JobDescriptionForm initialData={jdData} onSuccess={handleSuccess} />}
        </main>
        <AtlanFooter />
      </div>
    </ProtectedRoute>
  )
}

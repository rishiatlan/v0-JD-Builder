"use client"
import { AtlanHeader } from "@/components/atlan-header"
import { AtlanFooter } from "@/components/atlan-footer"
import JobDescriptionForm from "@/components/job-description-form"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"

export default function NewJobDescriptionPage() {
  const router = useRouter()

  const handleSuccess = (data: any) => {
    // Redirect to the JD view page
    if (data?.id) {
      router.push(`/jd/${data.id}`)
    } else {
      router.push("/history")
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <AtlanHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-atlan-primary mb-8">
            Create New Job Description
          </h1>
          <p className="text-center text-slate-600 max-w-3xl mx-auto mb-12">
            Fill out the form below to create a new job description.
          </p>

          <JobDescriptionForm onSuccess={handleSuccess} />
        </main>
        <AtlanFooter />
      </div>
    </ProtectedRoute>
  )
}

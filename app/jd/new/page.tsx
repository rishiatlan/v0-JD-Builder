"use client"
import { EnhancedHeader } from "@/components/enhanced-header"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { JobDescriptionForm } from "@/components/job-description-form"

export default function NewJDPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <EnhancedHeader />
      <main className="flex-grow bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">Create New Job Description</h1>
          <JobDescriptionForm />
        </div>
      </main>
      <EnhancedFooter />
    </div>
  )
}

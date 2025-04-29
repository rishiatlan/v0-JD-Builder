export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { AtlanHeader } from "@/components/atlan-header"
import { AtlanFooter } from "@/components/atlan-footer"
import { TemplatesContent } from "@/components/templates-content"

export default function TemplatesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AtlanHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-atlan-primary mb-8">JD Templates</h1>
        <p className="text-center text-slate-600 max-w-3xl mx-auto mb-12">
          Start with a template to create your job description faster.
        </p>
        <Suspense fallback={<div className="text-center py-10">Loading templates...</div>}>
          <TemplatesContent />
        </Suspense>
      </main>
      <AtlanFooter />
    </div>
  )
}

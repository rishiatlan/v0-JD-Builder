import { Suspense } from "react"
import { JDAnalyzer } from "@/components/jd-analyzer"
import { AtlanHeader } from "@/components/atlan-header"
import { AtlanFooter } from "@/components/atlan-footer"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AtlanHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-atlan-primary mb-8">Job Description Analyzer</h1>
        <p className="text-center text-slate-600 max-w-3xl mx-auto mb-12">
          Empower your hiring process with Atlan's smart JD analyzer. Craft world-class, Atlan-standard job descriptions
          that attract top 10% global talent.
        </p>
        <Suspense fallback={<div className="text-center py-10">Loading JD Analyzer...</div>}>
          <JDAnalyzer />
        </Suspense>
      </main>
      <AtlanFooter />
    </div>
  )
}

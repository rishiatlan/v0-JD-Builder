import { JDAnalyzer } from "@/components/jd-analyzer"
import { AtlanHeader } from "@/components/atlan-header"
import { AtlanFooter } from "@/components/atlan-footer"
import { Suspense } from "react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <AtlanHeader />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-atlan-primary mb-8">Atlan JD Builder</h1>
        <p className="text-center text-slate-600 max-w-3xl mx-auto mb-12">
          Create world-class job descriptions that follow Atlan's standards of excellence.
        </p>
        <Suspense fallback={<div className="text-center p-8">Loading JD Builder...</div>}>
          <JDAnalyzer />
        </Suspense>
      </main>
      <AtlanFooter />
    </div>
  )
}

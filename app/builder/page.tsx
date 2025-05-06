"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { IntakeForm } from "@/components/intake-form"
import { JDRefinement } from "@/components/jd-refinement"
import { JDOutput } from "@/components/jd-output"
import { EnhancedJDSummary } from "@/components/enhanced-jd-summary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function BuilderPage() {
  const [step, setStep] = useState(1)
  const [jdData, setJdData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEnhanced, setIsEnhanced] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we're coming from an enhanced JD
    const enhanced = searchParams.get("enhanced")
    const id = searchParams.get("id")
    const warningParam = searchParams.get("warning")

    if (warningParam) {
      setWarning(decodeURIComponent(warningParam))
    }

    if (enhanced === "true" && id) {
      setIsEnhanced(true)

      // In a real app, this would fetch from a database
      // For now, we'll use session storage
      const enhancedJDData = sessionStorage.getItem(`enhanced_jd_${id}`)

      if (enhancedJDData) {
        try {
          const parsedData = JSON.parse(enhancedJDData)
          setJdData(parsedData)
          setStep(2) // Go directly to refinement step
        } catch (error) {
          console.error("Error parsing enhanced JD data:", error)
        }
      }
    }
  }, [searchParams])

  const handleIntakeSubmit = (data: any, warning?: string) => {
    setJdData(data)
    if (warning) {
      setWarning(warning)
    } else {
      setWarning(null)
    }
    setStep(2)
  }

  const handleRefinementComplete = (data: any) => {
    setJdData(data)
    setStep(3)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-atlan-primary mb-2">Atlan JD Builder</h1>
          <p className="text-slate-600">
            Create world-class job descriptions that follow Atlan&apos;s standards of excellence.
          </p>
        </div>

        {warning && (
          <Alert variant="warning" className="mb-6 max-w-4xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        )}

        {/* Step Indicator */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <div
                className={`rounded-full w-8 h-8 flex items-center justify-center ${
                  step === 1 ? "bg-atlan-primary text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                1
              </div>
              <span className={step === 1 ? "text-atlan-primary font-medium" : "text-slate-500"}>Intake</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 mx-2"></div>
            <div className="flex items-center space-x-2 flex-1">
              <div
                className={`rounded-full w-8 h-8 flex items-center justify-center ${
                  step === 2 ? "bg-atlan-primary text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                2
              </div>
              <span className={step === 2 ? "text-atlan-primary font-medium" : "text-slate-500"}>Analysis</span>
            </div>
            <div className="h-px bg-slate-200 flex-1 mx-2"></div>
            <div className="flex items-center space-x-2 flex-1">
              <div
                className={`rounded-full w-8 h-8 flex items-center justify-center ${
                  step === 3 ? "bg-atlan-primary text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                3
              </div>
              <span className={step === 3 ? "text-atlan-primary font-medium" : "text-slate-500"}>Final</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {isEnhanced && jdData && step === 2 && <EnhancedJDSummary data={jdData} onContinue={() => setStep(2)} />}

          {step === 1 && <IntakeForm onSubmit={handleIntakeSubmit} isLoading={isLoading} />}

          {step === 2 && jdData && !isEnhanced && (
            <JDRefinement data={jdData} onComplete={handleRefinementComplete} isLoading={isLoading} />
          )}

          {step === 2 && jdData && isEnhanced && (
            <JDRefinement data={jdData} onComplete={handleRefinementComplete} isLoading={isLoading} />
          )}

          {step === 3 && jdData && <JDOutput data={jdData} />}
        </div>
      </main>
    </div>
  )
}

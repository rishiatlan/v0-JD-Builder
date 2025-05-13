"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { IntakeForm } from "@/components/intake-form"
import { JDRefinement } from "@/components/jd-refinement"
import { JDOutput } from "@/components/jd-output"
import { EnhancedJDSummary } from "@/components/enhanced-jd-summary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function BuilderPage() {
  const [step, setStep] = useState(1)
  const [jdData, setJdData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnhanced, setIsEnhanced] = useState(false)
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [dataLoadError, setDataLoadError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setDataLoadError(null)

      // Check if we're coming from an enhanced or analyzed JD
      const enhanced = searchParams.get("enhanced")
      const analyzed = searchParams.get("analyzed")
      const id = searchParams.get("id")
      const warningParam = searchParams.get("warning")

      if (warningParam) {
        setWarning(decodeURIComponent(warningParam))
      }

      if ((enhanced === "true" || analyzed === "true") && id) {
        // Set the appropriate flags
        setIsEnhanced(enhanced === "true")
        setIsAnalyzed(analyzed === "true")

        // Try to get data from session storage
        const storageKey = enhanced === "true" ? `enhanced_jd_${id}` : `analyzed_doc_${id}`
        const storedData = sessionStorage.getItem(storageKey)

        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData)
            setJdData(parsedData)
            setStep(2) // Go directly to refinement step

            console.log(`Successfully loaded ${enhanced ? "enhanced" : "analyzed"} JD data:`, parsedData)
          } catch (error) {
            console.error(`Error parsing ${enhanced ? "enhanced" : "analyzed"} JD data:`, error)
            setDataLoadError(
              `Could not load the ${enhanced ? "enhanced" : "analyzed"} job description. Please try again.`,
            )
            toast({
              title: "Error",
              description: `Could not load the ${enhanced ? "enhanced" : "analyzed"} job description. Please try again.`,
              variant: "destructive",
            })
          }
        } else {
          // Handle case where data is not found
          const errorMsg = `The ${enhanced ? "enhanced" : "analyzed"} job description could not be found. It may have expired.`
          setDataLoadError(errorMsg)
          toast({
            title: "Data Not Found",
            description: errorMsg,
            variant: "destructive",
          })
        }
      }

      setIsLoading(false)
    }

    loadData()
  }, [searchParams, toast])

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
    console.log("Refinement complete with data:", data)

    try {
      // Store the finalized JD data in session storage for persistence
      const jdId = `jd_${Date.now()}`
      sessionStorage.setItem(`finalized_jd_${jdId}`, JSON.stringify(data))

      // Update the state with the finalized data
      setJdData(data)

      // Move to the final step
      setStep(3)

      // Show success notification
      toast({
        title: "JD Finalized Successfully",
        description: "Your job description has been finalized and is ready for review.",
      })
    } catch (error) {
      console.error("Error finalizing JD:", error)
      toast({
        title: "Error Finalizing JD",
        description: "There was a problem finalizing your job description. Please try again.",
        variant: "destructive",
      })
    }
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

        {dataLoadError && (
          <Alert variant="destructive" className="mb-6 max-w-4xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{dataLoadError}</AlertDescription>
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-atlan-primary mb-4" />
              <p className="text-slate-600">Loading job description data...</p>
            </div>
          ) : (
            <>
              {isEnhanced && jdData && step === 2 && <EnhancedJDSummary data={jdData} onContinue={() => setStep(2)} />}

              {step === 1 && <IntakeForm onSubmit={handleIntakeSubmit} isLoading={isLoading} />}

              {step === 2 && jdData && (
                <JDRefinement
                  data={jdData}
                  onComplete={handleRefinementComplete}
                  isLoading={isLoading}
                  isAnalyzed={isAnalyzed}
                  isEnhanced={isEnhanced}
                />
              )}

              {step === 3 && jdData && <JDOutput data={jdData} />}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

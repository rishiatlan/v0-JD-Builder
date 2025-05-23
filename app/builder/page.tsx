"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { IntakeForm } from "@/components/intake-form"
import { JDRefinement } from "@/components/jd-refinement"
import { JDOutput } from "@/components/jd-output"
import { EnhancedJDSummary } from "@/components/enhanced-jd-summary"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ErrorBoundary } from "@/components/error-boundary"
import { SimpleDocxParser } from "@/components/simple-docx-parser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function BuilderPage() {
  const [step, setStep] = useState(1)
  const [jdData, setJdData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnhanced, setIsEnhanced] = useState(false)
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [dataLoadError, setDataLoadError] = useState<string | null>(null)
  const [documentContent, setDocumentContent] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>("questionnaire")
  const searchParams = useSearchParams()
  const router = useRouter()
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

  const handleDocumentParsed = (content: string) => {
    setDocumentContent(content)

    // Pre-fill the intake form with the parsed content
    // This is just a simple example - you might want to do more sophisticated processing
    const data = {
      role: "",
      department: "",
      outcomes: content.substring(0, 500), // Just use the first 500 chars as an example
      mindset: "",
      advantage: "",
      decisions: "",
    }

    setJdData(data)
    toast({
      title: "Document Parsed",
      description: "Document content has been extracted. You can now proceed with the analysis.",
    })
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="mb-4">We encountered an error while processing your request.</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-atlan-primary text-white rounded-md">
            Reload Page
          </button>
        </div>
      }
    >
      <div className="container mx-auto px-4 py-8">
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

              {step === 1 && (
                <Tabs defaultValue="questionnaire" value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="questionnaire">Dynamic Questionnaire</TabsTrigger>
                    <TabsTrigger value="upload">Upload Document</TabsTrigger>
                    <TabsTrigger value="enhance">Enhance JD</TabsTrigger>
                  </TabsList>

                  <TabsContent value="questionnaire">
                    <IntakeForm onSubmit={handleIntakeSubmit} isLoading={isLoading} />
                  </TabsContent>

                  <TabsContent value="upload">
                    <div className="space-y-6">
                      <SimpleDocxParser onParsedContent={handleDocumentParsed} />

                      {documentContent && (
                        <div className="mt-6 flex justify-center">
                          <button
                            onClick={() => setStep(2)}
                            className="px-6 py-2 bg-atlan-primary text-white rounded-md hover:bg-atlan-primary/90 transition-colors"
                          >
                            Continue to Analysis
                          </button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="enhance">
                    <div className="text-center py-12">
                      <h3 className="text-xl font-medium mb-4">Enhance an existing job description</h3>
                      <p className="text-slate-600 mb-6">
                        Upload an existing job description to enhance it with Atlan&apos;s standards.
                      </p>
                      <button
                        onClick={() => setActiveTab("upload")}
                        className="px-6 py-2 bg-atlan-primary text-white rounded-md hover:bg-atlan-primary/90 transition-colors"
                      >
                        Upload JD Document
                      </button>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

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
      </div>
    </ErrorBoundary>
  )
}

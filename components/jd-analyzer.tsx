"use client"

import type React from "react"

import { useState, useEffect, useCallback, Suspense } from "react"
import { checkJDForBias } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import { useSearchParams } from "next/navigation"
import { JDService } from "@/lib/jd-service"
import { analytics } from "@/lib/analytics"
import { useAuth } from "@/lib/auth-context"
import { IntakeForm } from "@/components/intake-form"
import { JDAnalysis } from "@/components/jd-analysis"
import { JDRefinement } from "@/components/jd-refinement"
import { JDOutput } from "@/components/jd-output"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, Save } from "lucide-react"
// Add import for the PDF utilities
import { jdToHtml, jdToText } from "@/lib/pdf-utils"
import { generateWordDocument } from "@/lib/docx-utils"

const SearchParamsComponent = ({ children }: { children: (searchParams: URLSearchParams) => React.ReactNode }) => {
  const searchParams = useSearchParams()
  return <>{children(searchParams)}</>
}

export function JDAnalyzer() {
  const [activeStep, setActiveStep] = useState<number>(1)
  const [jdData, setJdData] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [templateData, setTemplateData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [showEmailDialog, setShowEmailDialog] = useState<boolean>(false)
  const [userEmail, setUserEmail] = useState<string>("")
  const { toast } = useToast()
  const { authState } = useAuth()
  const [exportFormat, setExportFormat] = useState<"txt" | "pdf" | "docx">("txt")
  const searchParams = useSearchParams()

  // Check for template parameter
  const handleSearchParams = useCallback(() => {
    if (!searchParams) return

    const template = searchParams.get("template")
    if (template) {
      // In a real app, we would fetch template data from an API
      loadTemplate(template)
    }
  }, [searchParams, toast])

  // Set user email if authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.user?.email) {
      setUserEmail(authState.user.email)
    }
  }, [authState.isAuthenticated, authState.user])

  useEffect(() => {
    handleSearchParams()
  }, [handleSearchParams])

  const loadTemplate = async (templateId: string) => {
    try {
      // Fetch template from database
      const { success, data, error } = await JDService.getJD(templateId)

      if (success && data) {
        setTemplateData(data.content)
        toast({
          title: "Template Loaded",
          description: `${data.title} template has been loaded. You can customize it further.`,
        })

        // Track template usage
        analytics.track("template_loaded", { templateId, title: data.title })
      } else if (error) {
        toast({
          title: "Error",
          description: `Failed to load template: ${error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading template:", error)
      toast({
        title: "Error",
        description: "Failed to load template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleIntakeSubmit = useCallback(
    (data: any) => {
      setIsAnalyzing(true)
      setJdData(data)
      setIsAnalyzing(false)
      setActiveStep(2)

      // Track JD generation
      analytics.track("jd_generation_completed", {
        title: data.title,
        department: data.department,
      })
    },
    [toast],
  )

  const handleRefinementComplete = useCallback(
    async (refinedData: any) => {
      setIsAnalyzing(true)

      try {
        // Get all content as a single string for bias checking
        const allContent = Object.values(refinedData.sections || {})
          .map((section: any) => {
            if (Array.isArray(section)) {
              return section.join(" ")
            }
            return section
          })
          .join(" ")

        // Check for bias in chunks to avoid overloading the API
        let biasFlags = []
        try {
          const biasResult = await checkJDForBias(allContent)
          if (biasResult.success) {
            biasFlags = biasResult.biasFlags || []
          } else {
            console.warn("Bias check failed, using empty results", biasResult.error)
            // Continue without bias check results
          }
        } catch (error) {
          console.error("Error during bias check:", error)
          // Continue without bias check results
        }

        // Update JD data with refined content and bias flags
        setJdData({
          ...jdData,
          ...refinedData,
          biasFlags,
        })

        // Track refinement completion
        analytics.track("jd_refinement_completed", {
          title: jdData?.title,
          biasFlags: biasFlags?.length || 0,
        })

        // Move to next step
        setActiveStep(3)
      } catch (error) {
        console.error("Error during refinement completion:", error)
        toast({
          title: "Error",
          description: "An error occurred during final processing. You can still proceed with the JD.",
          variant: "destructive",
        })

        // Still update the data and proceed even if there was an error
        setJdData({
          ...jdData,
          ...refinedData,
        })
        setActiveStep(3)
      } finally {
        setIsAnalyzing(false)
      }
    },
    [jdData, toast],
  )

  const handleSaveJD = useCallback(() => {
    if (!jdData) return

    // If user is authenticated, use their email
    if (authState.isAuthenticated && authState.user?.email) {
      saveJDWithEmail(authState.user.email)
    } else {
      // Show email dialog for non-authenticated users
      setShowEmailDialog(true)
    }
  }, [jdData, authState.isAuthenticated, authState.user])

  const handleSaveWithEmail = useCallback(() => {
    if (!jdData) return

    // Validate email
    if (!userEmail || !userEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    saveJDWithEmail(userEmail)
  }, [jdData, userEmail, toast])

  const saveJDWithEmail = useCallback(
    async (email: string) => {
      setIsSaving(true)
      setShowEmailDialog(false)

      try {
        const jdToSave = {
          title: jdData.title,
          department: jdData.department,
          content: jdData,
          user_email: email,
          is_public: true, // Default to public
        }

        const { success, data, error } = await JDService.saveJD(jdToSave)

        if (success) {
          toast({
            title: "Success",
            description: "Job description saved successfully!",
          })

          // Track save event
          analytics.track("jd_saved", {
            id: data?.id,
            title: jdData.title,
            userEmail: email,
          })
        } else {
          toast({
            title: "Error",
            description: error || "Failed to save job description",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error saving JD:", error)
        toast({
          title: "Error",
          description: "An unexpected error occurred while saving",
          variant: "destructive",
        })
      } finally {
        setIsSaving(false)
      }
    },
    [jdData, toast],
  )

  // Update the handleDownload function to use these utilities
  const handleDownload = useCallback(() => {
    if (!jdData) return

    try {
      // Handle different export formats
      if (exportFormat === "txt") {
        // Create a blob and download as text
        const textContent = jdToText(jdData)
        const blob = new Blob([textContent], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${jdData.title.replace(/\s+/g, "-").toLowerCase()}-job-description.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (exportFormat === "docx") {
        // For DOCX, use the docx library to generate a proper Word document
        generateWordDocument(jdData)
          .then((blob) => {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `${jdData.title.replace(/\s+/g, "-").toLowerCase()}-job-description.docx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          })
          .catch((error) => {
            console.error("Error generating Word document:", error)
            toast({
              title: "Error",
              description: "Failed to generate Word document. Please try another format.",
              variant: "destructive",
            })
          })
      } else if (exportFormat === "pdf") {
        // For PDF, we'll use HTML that can be printed to PDF
        const htmlContent = jdToHtml(jdData)

        // Create a blob with HTML content
        const blob = new Blob([htmlContent], { type: "text/html" })
        const url = URL.createObjectURL(blob)

        // Open in a new window for printing to PDF
        const printWindow = window.open(url, "_blank")
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print()
          }
        } else {
          // If popup blocked, provide direct download
          const a = document.createElement("a")
          a.href = url
          a.download = `${jdData.title.replace(/\s+/g, "-").toLowerCase()}-job-description.html`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)

          toast({
            title: "PDF Generation",
            description: "Please open the HTML file and use your browser's print function to save as PDF",
            variant: "default",
          })
        }
        URL.revokeObjectURL(url)
      }

      toast({
        title: "Success",
        description: `Job description downloaded successfully as ${exportFormat.toUpperCase()}!`,
        variant: "default",
      })

      // Track download event
      analytics.track("jd_downloaded", {
        title: jdData.title,
        format: exportFormat,
      })
    } catch (error) {
      console.error("Error downloading JD:", error)
      toast({
        title: "Error",
        description: "Failed to download job description",
        variant: "destructive",
      })
    }
  }, [jdData, toast, exportFormat])

  const renderStep = () => {
    switch (activeStep) {
      case 1:
        return <IntakeForm onSubmit={handleIntakeSubmit} isLoading={isAnalyzing} initialData={templateData} />
      case 2:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <JDAnalysis data={jdData} />
            </div>
            <div className="lg:col-span-2">
              <JDRefinement data={jdData} onComplete={handleRefinementComplete} />
            </div>
          </div>
        )
      case 3:
        return (
          <div className="space-y-6">
            <div className="flex justify-end space-x-4 mb-4">
              <div className="flex items-center space-x-2 mr-auto">
                <Label htmlFor="export-format">Export Format:</Label>
                <select
                  id="export-format"
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as "txt" | "pdf" | "docx")}
                >
                  <option value="txt">Text (.txt)</option>
                  <option value="docx">Word (.docx)</option>
                  <option value="pdf">PDF (.pdf)</option>
                </select>
              </div>
              <Button
                variant="outline"
                onClick={() => setActiveStep(2)}
                disabled={isAnalyzing}
                className="flex items-center"
              >
                Edit JD
              </Button>
              <Button variant="outline" onClick={handleDownload} className="flex items-center" disabled={!jdData}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                onClick={handleSaveJD}
                className="bg-atlan-primary hover:bg-atlan-primary-dark flex items-center"
                disabled={!jdData || isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save JD"}
              </Button>
            </div>

            <JDOutput data={jdData} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">
            {activeStep === 1
              ? "Step 1: Role Information"
              : activeStep === 2
                ? "Step 2: Analysis & Refinement"
                : "Step 3: Final Job Description"}
          </h2>
          <div className="flex items-center">
            <div className={`flex items-center ${activeStep >= 1 ? "text-atlan-primary" : "text-slate-400"}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 border-current">
                1
              </div>
              <span className="hidden md:inline">Intake</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-200 mx-1"></div>
            <div className={`flex items-center ${activeStep >= 2 ? "text-atlan-primary" : "text-slate-400"}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 border-current">
                2
              </div>
              <span className="hidden md:inline">Analysis</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-200 mx-1"></div>
            <div className={`flex items-center ${activeStep >= 3 ? "text-atlan-primary" : "text-slate-400"}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 border-current">
                3
              </div>
              <span className="hidden md:inline">Final</span>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <SearchParamsComponent>
            {(searchParams) => {
              return <>{renderStep()}</>
            }}
          </SearchParamsComponent>
        </Suspense>

        {/* Email Dialog */}
        <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save Your Job Description</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-slate-600">
                Please enter your email address to save this job description. You'll be able to access it later.
              </p>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEmailDialog(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSaveWithEmail}
                className="bg-atlan-primary hover:bg-atlan-primary-dark"
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

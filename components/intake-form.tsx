"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Loader2, AlertCircle, Eye, Info } from "lucide-react"
import { generateJD, analyzeUploadedDocument } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import { DocumentParser } from "@/components/document-parser"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { departments } from "@/lib/department-data"

interface IntakeFormProps {
  onSubmit: (data: any, warning?: string) => void
  isLoading: boolean
  initialData?: any
}

// Debounce function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function IntakeForm({ onSubmit, isLoading, initialData }: IntakeFormProps) {
  const [activeTab, setActiveTab] = useState<string>("questionnaire")
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    outcomes: "",
    measurableOutcomes: "",
    mindset: "",
    advantage: "",
    decisions: "",
    includeStrategicVision: true,
  })
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [localLoading, setLocalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const { toast } = useToast()
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [lastSubmitTime, setLastSubmitTime] = useState(0)
  const RATE_LIMIT_MS = 10000 // 10 seconds between submissions
  const [isSubmitPending, setIsSubmitPending] = useState(false)

  // Debounce the form data to prevent excessive re-renders
  const debouncedFormData = useDebounce(formData, 300)

  // Apply initial data if provided
  useEffect(() => {
    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
      }))
    }
  }, [initialData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setFileContent(null)

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size exceeds 10MB limit. Please upload a smaller file.")
        toast({
          title: "Error",
          description: "File size exceeds 10MB limit. Please upload a smaller file.",
          variant: "destructive",
        })
        return
      }

      // Check file type
      const validTypes = [".pdf", ".docx", ".txt"]
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf(".")).toLowerCase()

      if (!validTypes.includes(fileExtension)) {
        setError("Invalid file type. Please upload a PDF, DOCX, or TXT file.")
        toast({
          title: "Error",
          description: "Invalid file type. Please upload a PDF, DOCX, or TXT file.",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const handleContentParsed = (content: string) => {
    setFileContent(content)
    toast({
      title: "File parsed successfully",
      description: `${file?.name} has been parsed and is ready for analysis.`,
    })
  }

  const handleParseError = (errorMessage: string) => {
    setError(errorMessage)
    toast({
      title: "Error",
      description: errorMessage,
      variant: "destructive",
    })
  }

  // Debounced submit handler
  const debouncedSubmit = useCallback(async () => {
    if (!isSubmitPending) return

    // Check rate limiting
    const now = Date.now()
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastSubmitTime)) / 1000)
      setError(`Please wait ${waitTime} seconds before submitting again to avoid overloading the AI service.`)
      toast({
        title: "Rate Limited",
        description: `Please wait ${waitTime} seconds before submitting again.`,
        variant: "destructive",
      })
      setIsSubmitPending(false)
      return
    }

    setError(null)
    setLocalLoading(true)
    setIsSubmitted(true)
    setLastSubmitTime(now)

    try {
      let result // Declare result here

      if (activeTab === "questionnaire") {
        console.log("Submitting questionnaire data:", debouncedFormData)

        // Create FormData object
        const formDataObj = new FormData()
        Object.entries(debouncedFormData).forEach(([key, value]) => {
          if (typeof value === "boolean") {
            formDataObj.append(key, value.toString())
          } else {
            formDataObj.append(key, value as string)
          }
        })

        // Call the server action
        result = await generateJD(formDataObj)
        console.log("generateJD result:", result)

        if (result.success) {
          onSubmit(result.data, result.warning)
          if (result.warning) {
            toast({
              title: "Note",
              description: result.warning,
              variant: "default",
            })
          }
        } else {
          setError(result.error || "Failed to generate job description")
          toast({
            title: "Error",
            description: result.error || "Failed to generate job description",
            variant: "destructive",
          })
        }
      } else if (fileContent) {
        console.log("Analyzing file content...")

        // Call the server action to analyze the document
        result = await analyzeUploadedDocument(fileContent)
        console.log("analyzeUploadedDocument result:", result)

        if (result.success) {
          onSubmit(result.data, result.warning)
          if (result.warning) {
            toast({
              title: "Note",
              description: result.warning,
              variant: "default",
            })
          }
        } else {
          // Check if the error is related to the Gemini API being overloaded
          if (result.error?.includes("overloaded") || result.error?.includes("503")) {
            setError("The AI service is currently experiencing high demand. Please try again in a few moments.")
            toast({
              title: "Service Busy",
              description: "The AI service is currently experiencing high demand. Please try again in a few moments.",
              variant: "destructive",
            })
          } else {
            setError(result.error || "Failed to analyze the uploaded document")
            toast({
              title: "Error",
              description: result.error || "Failed to analyze the uploaded document",
              variant: "destructive",
            })
          }
        }
      } else {
        setError("Please select a file to upload")
        toast({
          title: "Error",
          description: "Please select a file to upload",
          variant: "destructive",
        })
      }

      // Add this code after the successful document analysis:
      if (activeTab === "upload" && result?.success) {
        // Store the analyzed document data with a specific key format
        const analyzedId = `analyzed_jd_${Date.now()}`
        sessionStorage.setItem(analyzedId, JSON.stringify(result.data))

        // You might want to update the URL to include the analyzed parameter
        // This would typically be done with router.push but since we're using
        // the existing onSubmit callback, we'll let the parent component handle it
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      setError("An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLocalLoading(false)
      setIsSubmitPending(false)
    }
  }, [activeTab, debouncedFormData, fileContent, file, lastSubmitTime, isSubmitPending, onSubmit, toast])

  // Set up the effect for debounced submission
  useEffect(() => {
    if (isSubmitPending) {
      debouncedSubmit()
    }
  }, [isSubmitPending, debouncedSubmit])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitPending(true)
  }

  return (
    <Card className="bg-white border border-slate-200 rounded-lg overflow-hidden">
      <CardContent className="pt-6">
        <Tabs defaultValue="questionnaire" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 border-b border-slate-200 rounded-none">
            <TabsTrigger
              value="questionnaire"
              className="py-3 px-4 text-center font-medium data-[state=active]:bg-atlan-primary data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 rounded-none"
            >
              <FileText className="mr-2 h-4 w-4" />
              Dynamic Questionnaire
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="py-3 px-4 text-center font-medium data-[state=active]:bg-atlan-primary data-[state=active]:text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-slate-50 rounded-none"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questionnaire">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Role Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Senior Product Manager"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    name="department"
                    value={formData.department}
                    onValueChange={(value) => handleSelectChange("department", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcomes">What are the 1-2 outcomes that define success in this role?</Label>
                <Textarea
                  id="outcomes"
                  name="outcomes"
                  placeholder="Describe the key outcomes that would indicate success in this role..."
                  value={formData.outcomes}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="measurableOutcomes">
                  What are 3-5 measurable outcomes this role should achieve in 12 months?
                </Label>
                <Textarea
                  id="measurableOutcomes"
                  name="measurableOutcomes"
                  placeholder="List specific, measurable outcomes this person should achieve in their first year..."
                  value={formData.measurableOutcomes}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  <Info className="inline h-3 w-3 mr-1" />
                  Focus on what this person will make better, solve, or enable with specific metrics
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mindset">
                  What mindset or instincts would differentiate top 10% performers in this role?
                </Label>
                <Textarea
                  id="mindset"
                  name="mindset"
                  placeholder="Describe the mindset, instincts, or qualities that would set apart exceptional performers..."
                  value={formData.mindset}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="advantage">What strategic advantage will this role unlock for Atlan?</Label>
                <Textarea
                  id="advantage"
                  name="advantage"
                  placeholder="Explain how this role contributes to Atlan's strategic goals and competitive advantage..."
                  value={formData.advantage}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="decisions">What types of decisions/trade-offs will the person need to navigate?</Label>
                <Textarea
                  id="decisions"
                  name="decisions"
                  placeholder="Describe the key decisions and trade-offs this person will face in their role..."
                  value={formData.decisions}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeStrategicVision"
                  checked={formData.includeStrategicVision}
                  onCheckedChange={(checked) => handleCheckboxChange("includeStrategicVision", checked as boolean)}
                />
                <Label htmlFor="includeStrategicVision" className="text-sm font-medium">
                  Include a Strategic Vision paragraph for this role
                </Label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-atlan-primary hover:bg-atlan-primary-dark"
                disabled={isLoading || localLoading || isSubmitPending}
              >
                {isLoading || localLoading || isSubmitPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Generate Atlan-Standard JD"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="upload">
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="p-3 bg-slate-100 rounded-full">
                    <Upload className="h-8 w-8 text-atlan-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">Upload your document</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      Drag and drop or click to upload a PDF, DOCX, or TXT file
                    </p>
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileChange}
                  />
                  <Button
                    onClick={() => document.getElementById("file-upload")?.click()}
                    variant="outline"
                    className="border-atlan-primary text-atlan-primary hover:bg-atlan-primary/10"
                  >
                    Select File
                  </Button>
                </div>
              </div>

              {/* Document Parser Component */}
              {file && <DocumentParser file={file} onContentParsed={handleContentParsed} onError={handleParseError} />}

              {file && (
                <div className="bg-slate-100 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-atlan-primary mr-2" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {fileContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-slate-500 hover:text-slate-700 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {showPreview ? "Hide Preview" : "Preview"}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFile(null)
                        setFileContent(null)
                        setError(null)
                        setShowPreview(false)
                      }}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}

              {/* Document Preview */}
              {showPreview && fileContent && (
                <div className="border border-slate-200 rounded-md p-4 mt-4 max-h-64 overflow-auto bg-slate-50">
                  <h4 className="font-medium mb-2">Document Preview:</h4>
                  <pre className="text-sm whitespace-pre-wrap">
                    {fileContent.substring(0, 1000)}
                    {fileContent.length > 1000 ? "..." : ""}
                  </pre>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                className="w-full bg-atlan-primary hover:bg-atlan-primary-dark"
                disabled={!fileContent || isLoading || localLoading || isSubmitPending}
              >
                {isLoading || localLoading || isSubmitPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Document"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

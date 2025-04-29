"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react"
import { generateJD, analyzeUploadedDocument } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"

interface IntakeFormProps {
  onSubmit: (data: any) => void
  isLoading: boolean
  initialData?: any
}

export function IntakeForm({ onSubmit, isLoading, initialData }: IntakeFormProps) {
  const [activeTab, setActiveTab] = useState<string>("questionnaire")
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    outcomes: "",
    mindset: "",
    advantage: "",
    decisions: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [localLoading, setLocalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Read file content immediately on selection
      readFileContent(selectedFile)
    }
  }

  const readFileContent = (file: File) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        if (event.target?.result) {
          const content = event.target.result.toString()
          setFileContent(content)
          console.log("File content loaded successfully:", content.substring(0, 100) + "...")
        }
      } catch (err) {
        console.error("Error reading file:", err)
        setError("Failed to read file content. Please try a different file.")
        toast({
          title: "Error",
          description: "Failed to read file content. Please try a different file.",
          variant: "destructive",
        })
      }
    }

    reader.onerror = () => {
      console.error("FileReader error:", reader.error)
      setError("Error reading file. Please try again.")
      toast({
        title: "Error",
        description: "Error reading file. Please try again.",
        variant: "destructive",
      })
    }

    // Read as text for TXT files
    if (file.name.endsWith(".txt")) {
      reader.readAsText(file)
    }
    // For other file types (like PDF, DOCX), we can only extract text content on the server
    // For now, we'll just read as text and handle potential parsing issues
    else {
      reader.readAsText(file)
      toast({
        title: "Warning",
        description: "Only plain text content can be extracted from this file type. Complex formatting may be lost.",
        variant: "default",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLocalLoading(true)

    try {
      if (activeTab === "questionnaire") {
        console.log("Submitting questionnaire data:", formData)

        // Create FormData object
        const formDataObj = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
          formDataObj.append(key, value)
        })

        // Call the server action
        const result = await generateJD(formDataObj)
        console.log("generateJD result:", result)

        if (result.success) {
          onSubmit(result.data)
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
        const result = await analyzeUploadedDocument(fileContent)
        console.log("analyzeUploadedDocument result:", result)

        if (result.success) {
          onSubmit(result.data)
        } else {
          setError(result.error || "Failed to analyze the uploaded document")
          toast({
            title: "Error",
            description: result.error || "Failed to analyze the uploaded document",
            variant: "destructive",
          })
        }
      } else {
        setError("Please select a file to upload")
        toast({
          title: "Error",
          description: "Please select a file to upload",
          variant: "destructive",
        })
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
    }
  }

  return (
    <Card className="bg-white shadow-md border border-slate-200">
      <CardContent className="pt-6">
        <Tabs defaultValue="questionnaire" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger
              value="questionnaire"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              <FileText className="mr-2 h-4 w-4" />
              Dynamic Questionnaire
            </TabsTrigger>
            <TabsTrigger value="upload" className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white">
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
                  <Input
                    id="department"
                    name="department"
                    placeholder="e.g., Product"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                  />
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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-atlan-primary hover:bg-atlan-primary-dark"
                disabled={isLoading || localLoading}
              >
                {isLoading || localLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing with Gemini...
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
                  <Input id="file-upload" type="file" className="hidden" accept=".txt" onChange={handleFileChange} />
                  <Button
                    onClick={() => document.getElementById("file-upload")?.click()}
                    variant="outline"
                    className="border-atlan-primary text-atlan-primary hover:bg-atlan-primary/10"
                  >
                    Select File
                  </Button>
                </div>
              </div>

              {file && (
                <div className="bg-slate-100 p-4 rounded-lg flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-atlan-primary mr-2" />
                    <span className="text-sm font-medium">{file.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null)
                      setFileContent(null)
                      setError(null)
                    }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Remove
                  </Button>
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
                disabled={!file || isLoading || localLoading}
              >
                {isLoading || localLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing with Gemini...
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

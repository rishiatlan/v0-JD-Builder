"use client"

import type React from "react"
import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { departments } from "@/lib/department-data"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Upload,
  Sparkles,
  AlertCircle,
  Loader2,
  Eye,
  FileUp,
  Type,
  FileType,
  AlertTriangle,
  Cpu,
  Zap,
  BarChart,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { enhanceExistingJD } from "@/app/actions"
import { EnhancedDocumentParser } from "@/components/enhanced-document-parser"
import { FallbackDocumentParser } from "@/components/fallback-document-parser"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import debounce from "lodash.debounce"
import { processStringInChunks, logMemoryUsage, isMemoryUsageHigh, isStringTooLarge } from "@/lib/memory-optimization"
import { isWorkerSupported } from "@/lib/worker-manager"
import { ProgressiveDocumentPreview } from "@/components/progressive-document-preview"
import useWorkerPool from "@/hooks/use-worker-pool"
import { TaskPriority } from "@/lib/worker-pool"
import { getWorkerPool, cleanupWorkerPool } from "@/lib/worker-pool"

export function JDBuilderForm() {
  const [activeTab, setActiveTab] = useState("questionnaire")
  const [department, setDepartment] = useState("")
  const [enhanceFile, setEnhanceFile] = useState<File | null>(null)
  const [enhanceContent, setEnhanceContent] = useState<string | null>(null)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)
  const { toast } = useToast()
  const [showEnhancePreview, setShowEnhancePreview] = useState(false)
  const [enhanceInputMethod, setEnhanceInputMethod] = useState<"upload" | "paste">("upload")
  const [pastedJDContent, setPastedJDContent] = useState("")
  const [isParsing, setIsParsing] = useState(false)
  const [fileInfo, setFileInfo] = useState<{ name: string; type: string; size: string } | null>(null)
  const [useEnhancedParser, setUseEnhancedParser] = useState(true)
  const [processingChunks, setProcessingChunks] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState<string | undefined>(undefined)
  const debouncedEnhanceRef = useRef<any>(null)
  const [memoryWarning, setMemoryWarning] = useState<string | null>(null)
  const contentRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [usingWorker, setUsingWorker] = useState(false)
  const [showPoolStatus, setShowPoolStatus] = useState(false)
  const [poolStatus, setPoolStatus] = useState<any>(null)
  const { processText, enhanceText, getPoolStatus } = useWorkerPool()

  // Check if web workers are supported
  useEffect(() => {
    const workersSupported = isWorkerSupported
    setUsingWorker(workersSupported)

    if (workersSupported) {
      // Initialize worker pool
      const workerPool = getWorkerPool({
        maxDocumentWorkers: 2,
        maxTextWorkers: 2,
      })
      workerPool.initialize()
    }

    // Cleanup function
    return () => {
      // Cancel any pending operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Release large content from memory
      contentRef.current = null
      setEnhanceContent(null)

      // Cancel debounced functions
      if (debouncedEnhanceRef.current) {
        debouncedEnhanceRef.current.cancel()
      }

      // Clean up worker pool
      cleanupWorkerPool()

      // Force garbage collection if possible
      if (typeof window !== "undefined" && "gc" in window) {
        try {
          // @ts-ignore
          window.gc()
        } catch (e) {
          // Ignore if gc is not available
        }
      }
    }
  }, [])

  // Update pool status periodically
  useEffect(() => {
    if (!usingWorker || !showPoolStatus) return

    const updatePoolStatus = () => {
      setPoolStatus(getPoolStatus())
    }

    // Update immediately
    updatePoolStatus()

    // Then update every second
    const interval = setInterval(updatePoolStatus, 1000)

    return () => clearInterval(interval)
  }, [usingWorker, showPoolStatus, getPoolStatus])

  // Check if enhanced parser is available
  useEffect(() => {
    const checkEnhancedParser = async () => {
      try {
        // Try to dynamically import the libraries
        await Promise.all([import("mammoth"), import("pdfjs-dist")])
        setUseEnhancedParser(true)
      } catch (error) {
        console.warn("Enhanced document parser not available, falling back to basic parser", error)
        setUseEnhancedParser(false)
      }
    }

    checkEnhancedParser()
  }, [])

  // Monitor memory usage periodically
  useEffect(() => {
    const memoryCheckInterval = setInterval(() => {
      if (isMemoryUsageHigh(90)) {
        setMemoryWarning(
          "High memory usage detected. Consider processing a smaller document or using a different browser.",
        )
      } else {
        setMemoryWarning(null)
      }
    }, 5000)

    return () => clearInterval(memoryCheckInterval)
  }, [])

  const handleEnhanceFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnhanceError(null)
    setEnhanceContent(null)
    setShowEnhancePreview(false)
    setFileInfo(null)
    setMemoryWarning(null)

    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check file size (limit to 50MB)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setEnhanceError("File size exceeds 50MB limit. Please upload a smaller file or split your document.")
        toast({
          title: "Error",
          description: "File size exceeds 50MB limit. Please upload a smaller file or split your document.",
          variant: "destructive",
        })
        return
      }

      // Check file type
      const validTypes = [
        "text/plain",
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ]

      if (!validTypes.includes(selectedFile.type)) {
        setEnhanceError("Invalid file type. Please upload a PDF, DOCX, or TXT file.")
        toast({
          title: "Error",
          description: "Invalid file type. Please upload a PDF, DOCX, or TXT file.",
          variant: "destructive",
        })
        return
      }

      // Format file size
      const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + " bytes"
        else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
        else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
      }

      // Get file type display name
      const getFileTypeDisplay = (type: string): string => {
        switch (type) {
          case "text/plain":
            return "Text Document"
          case "application/pdf":
            return "PDF Document"
          case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            return "Word Document (DOCX)"
          case "application/msword":
            return "Word Document (DOC)"
          default:
            return type
        }
      }

      // Set file info for display
      setFileInfo({
        name: selectedFile.name,
        type: getFileTypeDisplay(selectedFile.type),
        size: formatFileSize(selectedFile.size),
      })

      // Show warning for large files
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "Large File Detected",
          description: "Processing large files may take longer and use more memory. Please be patient.",
          variant: "warning",
        })
      }

      setEnhanceFile(selectedFile)
    }
  }

  // Process content in chunks to avoid UI freezes and memory issues
  const processContentInChunksWithMemoryCheck = useCallback(
    async (content: string, chunkSize = 5000, callback: (processedContent: string) => void) => {
      logMemoryUsage("Before processing chunks")
      setProcessingChunks(true)
      setProcessingProgress(0)
      setProcessingStage("Preparing content")

      // Create a new abort controller
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      try {
        // Store content in ref to avoid keeping multiple copies in state
        contentRef.current = content

        // Check if we can use worker pool
        if (usingWorker) {
          setProcessingStage("Processing with worker pool")

          processText(
            content,
            10000, // 10KB chunks
            {
              priority: TaskPriority.NORMAL,
              onProgress: (progress, stage) => {
                setProcessingProgress(progress)
                if (stage) setProcessingStage(stage)
              },
              onComplete: (processedContent) => {
                if (!signal.aborted) {
                  callback(processedContent)
                  setProcessingChunks(false)
                  setProcessingProgress(100)
                  setProcessingStage(undefined)
                }
              },
              onError: (error) => {
                console.error("Worker pool error:", error)
                setEnhanceError(error)

                // Fall back to main thread processing
                processInMainThread()
              },
            },
          )
        } else {
          // Process in main thread
          await processInMainThread()
        }

        // Main thread processing function
        async function processInMainThread() {
          setProcessingStage("Processing in main thread")

          // For very large content, use more aggressive chunking
          const effectiveChunkSize = isStringTooLarge(content.length, 20) ? 2000 : chunkSize

          // Process in chunks
          let processedContent = ""
          const chunks = []

          for (let i = 0; i < content.length; i += effectiveChunkSize) {
            if (signal.aborted) {
              throw new Error("Operation aborted")
            }

            // Check memory usage before processing next chunk
            if (isMemoryUsageHigh(85)) {
              setMemoryWarning("High memory usage detected. Processing in smaller chunks to avoid browser crashes.")
              // Wait for garbage collection
              await new Promise((resolve) => setTimeout(resolve, 200))
            }

            const end = Math.min(i + effectiveChunkSize, content.length)
            const chunk = content.substring(i, end)
            chunks.push(chunk)

            // Update progress
            setProcessingProgress(Math.round((end / content.length) * 100))

            // Small delay to allow UI updates
            await new Promise((resolve) => setTimeout(resolve, 10))
          }

          // Release original content to free memory
          content = ""

          setProcessingStage("Finalizing content")

          // Process chunks with small delays
          for (let i = 0; i < chunks.length; i++) {
            if (signal.aborted) {
              throw new Error("Operation aborted")
            }

            processedContent += chunks[i]

            // Update progress
            setProcessingProgress(Math.round(((i + 1) / chunks.length) * 100))

            // Free memory by removing processed chunks
            chunks[i] = ""

            // Small delay to allow UI updates
            await new Promise((resolve) => setTimeout(resolve, 5))
          }

          if (!signal.aborted) {
            callback(processedContent)
            setProcessingChunks(false)
            setProcessingProgress(100)
            setProcessingStage(undefined)
          }
        }
      } catch (error) {
        if (error instanceof Error && error.message === "Operation aborted") {
          console.log("Content processing was aborted")
        } else {
          console.error("Error processing content:", error)
          setEnhanceError("Error processing content. The document may be too large or complex.")
        }

        setProcessingChunks(false)
      }

      logMemoryUsage("After processing chunks")
    },
    [usingWorker, processText],
  )

  // Use useCallback with debounce to prevent excessive updates
  const handleEnhanceContentParsed = useCallback(
    (content: string) => {
      // Cancel any pending debounced calls
      if (debouncedEnhanceRef.current) {
        debouncedEnhanceRef.current.cancel()
      }

      // Create a new debounced function
      debouncedEnhanceRef.current = debounce((contentToProcess: string) => {
        // Check if content is too large
        if (isStringTooLarge(contentToProcess.length)) {
          // Process content in chunks to avoid UI freezes and memory issues
          processContentInChunksWithMemoryCheck(contentToProcess, 5000, (processedContent) => {
            setEnhanceContent(processedContent)
            toast({
              title: "File parsed successfully",
              description: "Your file has been parsed and is ready for enhancement.",
            })
          })
        } else {
          // For smaller content, set directly
          setEnhanceContent(contentToProcess)
          toast({
            title: "File parsed successfully",
            description: "Your file has been parsed and is ready for enhancement.",
          })
        }
      }, 300)

      // Call the debounced function
      debouncedEnhanceRef.current(content)
    },
    [toast, processContentInChunksWithMemoryCheck],
  )

  const handlePastedContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setPastedJDContent(value)

    // Cancel any pending debounced calls
    if (debouncedEnhanceRef.current) {
      debouncedEnhanceRef.current.cancel()
    }

    // Create a new debounced function for updating enhanceContent
    debouncedEnhanceRef.current = debounce((text: string) => {
      if (text.trim()) {
        // Check if content is too large
        if (isStringTooLarge(text.length)) {
          // Process in chunks
          processContentInChunksWithMemoryCheck(text, 5000, (processedContent) => {
            setEnhanceContent(processedContent)
          })
        } else {
          // For smaller content, set directly
          setEnhanceContent(text)
        }
      } else {
        setEnhanceContent(null)
      }
    }, 300)

    // Call the debounced function
    debouncedEnhanceRef.current(value)
  }

  const handleEnhanceJD = async () => {
    let contentToEnhance: string | null = null

    if (enhanceInputMethod === "upload") {
      contentToEnhance = enhanceContent
    } else if (enhanceInputMethod === "paste") {
      contentToEnhance = pastedJDContent.trim() || null
    }

    if (!contentToEnhance) {
      const errorMessage =
        enhanceInputMethod === "upload" ? "Please upload a JD file first." : "Please paste your JD content first."

      setEnhanceError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      return
    }

    setIsEnhancing(true)
    setEnhanceError(null)
    setProcessingProgress(0)
    setProcessingStage("Preparing content")

    try {
      // For very large content, we need to process it in chunks before sending to API
      if (isStringTooLarge(contentToEnhance.length)) {
        // Check if we can use worker pool
        if (usingWorker) {
          setProcessingStage("Processing with worker pool")

          enhanceText(
            contentToEnhance,
            {
              removeRedundancy: true,
              enhanceLanguage: true,
              convertPassiveToActive: true,
              removeIntensifiers: true,
            },
            {
              priority: TaskPriority.HIGH,
              onProgress: (progress, stage) => {
                setProcessingProgress(progress)
                if (stage) setProcessingStage(stage)
              },
              onComplete: async (processedContent) => {
                contentToEnhance = processedContent

                // Now call the API with the processed content
                await callEnhanceAPI(contentToEnhance)
              },
              onError: async (error) => {
                console.warn("Worker pool processing failed, falling back to main thread:", error)

                // Create a temporary variable to store the processed content
                let processedContent = ""

                // Process in chunks on main thread
                setProcessingStage("Processing in main thread")
                await processStringInChunks(
                  contentToEnhance!,
                  10000, // 10KB chunks
                  async (chunk) => {
                    processedContent += chunk
                    return chunk
                  },
                  setProcessingProgress,
                )

                // Release the original content to free memory
                contentToEnhance = processedContent

                // Now call the API with the processed content
                await callEnhanceAPI(contentToEnhance)
              },
            },
          )
        } else {
          // Create a temporary variable to store the processed content
          let processedContent = ""

          // Process in chunks on main thread
          setProcessingStage("Processing in main thread")
          await processStringInChunks(
            contentToEnhance,
            10000, // 10KB chunks
            async (chunk) => {
              processedContent += chunk
              return chunk
            },
            setProcessingProgress,
          )

          // Release the original content to free memory
          contentToEnhance = processedContent

          // Now call the API with the processed content
          await callEnhanceAPI(contentToEnhance)
        }
      } else {
        // For smaller content, call API directly
        await callEnhanceAPI(contentToEnhance)
      }
    } catch (error) {
      console.error("Error enhancing JD:", error)
      setEnhanceError("An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setIsEnhancing(false)
      setProcessingStage(undefined)
    }

    // Helper function to call the API
    async function callEnhanceAPI(content: string) {
      try {
        // Log memory usage before API call
        logMemoryUsage("Before API call")
        setProcessingStage("Enhancing content with AI")

        const result = await enhanceExistingJD(content)

        // Log memory usage after API call
        logMemoryUsage("After API call")

        if (result.success) {
          // Store the enhanced JD data in session storage
          if (result.id && result.data) {
            try {
              sessionStorage.setItem(`enhanced_jd_${result.id}`, JSON.stringify(result.data))
            } catch (storageError) {
              console.error("Error storing in session storage:", storageError)
              // If session storage fails (e.g., quota exceeded), try to store a smaller version
              const minimalData = {
                ...result.data,
                // Remove any large properties that aren't essential
                _originalContent: undefined,
              }
              try {
                sessionStorage.setItem(`enhanced_jd_${result.id}`, JSON.stringify(minimalData))
              } catch (fallbackError) {
                console.error("Failed to store even minimal data:", fallbackError)
                // Continue without storing in session storage
              }
            }
          }

          toast({
            title: "JD Enhanced Successfully",
            description: "Your JD has been enhanced and is ready for review.",
          })

          // Redirect to the builder page with the enhanced JD
          window.location.href = `/builder?enhanced=true&id=${result.id}${
            result.warning ? `&warning=${encodeURIComponent(result.warning)}` : ""
          }`
        } else {
          setEnhanceError(result.error || "Failed to enhance JD.")
          toast({
            title: "Error",
            description: result.error || "Failed to enhance JD.",
            variant: "destructive",
          })
          setIsEnhancing(false)
          setProcessingStage(undefined)
        }
      } catch (error) {
        console.error("API call error:", error)
        setEnhanceError("An unexpected error occurred. Please try again.")
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
        setIsEnhancing(false)
        setProcessingStage(undefined)
      } finally {
        // Release large content from memory
        contentRef.current = null

        // Force garbage collection if possible
        if (typeof window !== "undefined" && "gc" in window) {
          try {
            // @ts-ignore
            window.gc()
          } catch (e) {
            // Ignore if gc is not available
          }
        }
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Step 1: Role Information</h2>

        <div className="flex mb-6 border border-slate-200 rounded-md overflow-hidden">
          <button
            className={`flex-1 py-3 px-4 flex items-center justify-center ${
              activeTab === "questionnaire"
                ? "bg-atlan-primary text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => setActiveTab("questionnaire")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Dynamic Questionnaire
          </button>
          <button
            className={`flex-1 py-3 px-4 flex items-center justify-center ${
              activeTab === "upload" ? "bg-atlan-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => setActiveTab("upload")}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </button>
          <button
            className={`flex-1 py-3 px-4 flex items-center justify-center ${
              activeTab === "enhance" ? "bg-atlan-primary text-white" : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
            onClick={() => setActiveTab("enhance")}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Enhance JD
          </button>
        </div>

        {activeTab === "questionnaire" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <Label htmlFor="title">Role Title</Label>
                <Input id="title" placeholder="e.g., Senior Product Manager" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={department} onValueChange={setDepartment}>
                  <SelectTrigger id="department">
                    <SelectValue placeholder="e.g., Product" />
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

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="outcomes">What are the 1-2 outcomes that define success in this role?</Label>
                <Textarea
                  id="outcomes"
                  placeholder="Describe the key outcomes that would indicate success in this role..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mindset">
                  What mindset or instincts would differentiate top 10% performers in this role?
                </Label>
                <Textarea
                  id="mindset"
                  placeholder="Describe the mindset, instincts, or qualities that would set apart exceptional performers..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="advantage">What strategic advantage will this role unlock for Atlan?</Label>
                <Textarea
                  id="advantage"
                  placeholder="Explain how this role contributes to Atlan's strategic goals and competitive advantage..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="decisions">What types of decisions/trade-offs will the person need to navigate?</Label>
                <Textarea
                  id="decisions"
                  placeholder="Describe the key decisions and trade-offs this person will face in their role..."
                  rows={3}
                />
              </div>

              <Button
                className="w-full bg-atlan-primary hover:bg-atlan-primary-dark text-white"
                onClick={() => {
                  window.location.href = "/builder"
                }}
              >
                Generate Atlan-Standard JD
              </Button>
            </div>
          </>
        )}

        {activeTab === "upload" && (
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
                <Input id="document-upload" type="file" className="hidden" accept=".pdf,.docx,.txt" />
                <Button
                  onClick={() => document.getElementById("document-upload")?.click()}
                  variant="outline"
                  className="border-atlan-primary text-atlan-primary hover:bg-atlan-primary/10"
                >
                  Select File
                </Button>
              </div>
            </div>

            <Button
              className="w-full bg-atlan-primary hover:bg-atlan-primary-dark text-white"
              onClick={() => {
                window.location.href = "/builder"
              }}
            >
              Analyze Document
            </Button>
          </div>
        )}

        {activeTab === "enhance" && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-medium text-blue-800 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-blue-600" />
                Enhance Your Existing JD
              </h3>
              <p className="text-sm text-blue-700 mt-2">
                Upload your existing job description and our AI will enhance it by:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-blue-700">
                <li>Improving language clarity and impact</li>
                <li>Adding outcome-focused responsibilities</li>
                <li>Ensuring alignment with department guardrails</li>
                <li>Removing bias and improving inclusivity</li>
                <li>Applying Atlan's standards of excellence</li>
              </ul>
            </div>

            {usingWorker && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
                <Cpu className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-green-700">Using worker pool for background processing</p>
                  <p className="text-xs text-green-600 mt-1">
                    Heavy processing tasks will run in parallel worker threads to keep the UI responsive
                  </p>
                  <div className="mt-2 flex items-center">
                    <Button
                      variant="link"
                      size="sm"
                      className="h-6 p-0 text-green-600 hover:text-green-800"
                      onClick={() => setShowPoolStatus(!showPoolStatus)}
                    >
                      <BarChart className="h-3.5 w-3.5 mr-1" />
                      {showPoolStatus ? "Hide pool status" : "Show pool status"}
                    </Button>
                  </div>

                  {showPoolStatus && poolStatus && (
                    <div className="mt-2 text-xs bg-white/50 p-2 rounded border border-green-100">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="font-medium">Document Workers:</p>
                          <p>Total: {poolStatus.workers.document.total}</p>
                          <p>Busy: {poolStatus.workers.document.busy}</p>
                        </div>
                        <div>
                          <p className="font-medium">Text Workers:</p>
                          <p>Total: {poolStatus.workers.text.total}</p>
                          <p>Busy: {poolStatus.workers.text.busy}</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="font-medium">Tasks:</p>
                        <p>Queued: {poolStatus.tasks.queued}</p>
                        <p>Running: {poolStatus.tasks.running}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {memoryWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-amber-700">{memoryWarning}</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Try closing other browser tabs or restarting your browser to free up memory.
                  </p>
                </div>
              </div>
            )}

            <Tabs
              value={enhanceInputMethod}
              onValueChange={(value) => {
                setEnhanceInputMethod(value as "upload" | "paste")
                // Reset states when switching tabs
                setEnhanceError(null)
                setEnhanceContent(null)
                setEnhanceFile(null)
                setFileInfo(null)
                setShowEnhancePreview(false)

                // Release memory
                contentRef.current = null

                // Force garbage collection if possible
                if (typeof window !== "undefined" && "gc" in window) {
                  try {
                    // @ts-ignore
                    window.gc()
                  } catch (e) {
                    // Ignore if gc is not available
                  }
                }
              }}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 w-full mb-4">
                <TabsTrigger value="upload" className="flex items-center">
                  <FileUp className="h-4 w-4 mr-2" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="paste" className="flex items-center">
                  <Type className="h-4 w-4 mr-2" />
                  Paste Text
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-0">
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-3 bg-slate-100 rounded-full">
                      <Upload className="h-8 w-8 text-atlan-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Upload your existing JD</h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Drag and drop or click to upload a PDF, DOCX, or TXT file (max 50MB)
                      </p>
                    </div>
                    <Input
                      id="enhance-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.docx,.txt"
                      onChange={handleEnhanceFileChange}
                    />
                    <Button
                      onClick={() => document.getElementById("enhance-upload")?.click()}
                      variant="outline"
                      className="border-atlan-primary text-atlan-primary hover:bg-atlan-primary/10"
                    >
                      Select File
                    </Button>
                  </div>
                </div>

                {enhanceFile && useEnhancedParser && (
                  <EnhancedDocumentParser
                    file={enhanceFile}
                    onContentParsed={handleEnhanceContentParsed}
                    onError={(error) => {
                      setEnhanceError(error)
                      toast({
                        title: "Error",
                        description: error,
                        variant: "destructive",
                      })
                    }}
                    onParsingStart={() => setIsParsing(true)}
                    onParsingComplete={() => setIsParsing(false)}
                  />
                )}

                {enhanceFile && !useEnhancedParser && (
                  <FallbackDocumentParser
                    file={enhanceFile}
                    onContentParsed={handleEnhanceContentParsed}
                    onError={(error) => {
                      setEnhanceError(error)
                      toast({
                        title: "Error",
                        description: error,
                        variant: "destructive",
                      })
                    }}
                    onParsingStart={() => setIsParsing(true)}
                    onParsingComplete={() => setIsParsing(false)}
                  />
                )}

                {fileInfo && (
                  <div className="bg-slate-100 p-4 rounded-lg mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileType className="h-5 w-5 text-atlan-primary mr-2" />
                        <div>
                          <span className="text-sm font-medium">{fileInfo.name}</span>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {fileInfo.type} • {fileInfo.size}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {enhanceContent && !isParsing && !processingChunks && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowEnhancePreview(!showEnhancePreview)}
                            className="text-slate-500 hover:text-slate-700 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {showEnhancePreview ? "Hide Preview" : "Preview"}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEnhanceFile(null)
                            setEnhanceContent(null)
                            setEnhanceError(null)
                            setFileInfo(null)
                            setShowEnhancePreview(false)

                            // Release memory
                            contentRef.current = null

                            // Abort any ongoing operations
                            if (abortControllerRef.current) {
                              abortControllerRef.current.abort()
                              abortControllerRef.current = null
                            }
                          }}
                          className="text-slate-500 hover:text-slate-700"
                          disabled={isParsing || processingChunks}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    {isParsing && (
                      <div className="mt-3">
                        <div className="flex items-center mb-1">
                          <Loader2 className="h-3 w-3 animate-spin text-atlan-primary mr-2" />
                          <span className="text-xs text-slate-600">Parsing document...</span>
                        </div>
                        <Progress value={45} className="h-1" />
                      </div>
                    )}
                    {processingChunks && (
                      <div className="mt-3">
                        <div className="flex items-center mb-1">
                          <Loader2 className="h-3 w-3 animate-spin text-atlan-primary mr-2" />
                          <span className="text-xs text-slate-600">
                            {processingStage
                              ? `${processingStage} (${processingProgress}%)`
                              : `Processing document (${processingProgress}%)...`}
                          </span>
                        </div>
                        <Progress value={processingProgress} className="h-1" />
                        {usingWorker && (
                          <div className="flex items-center mt-1">
                            <Cpu className="h-3 w-3 text-green-500 mr-1" />
                            <span className="text-xs text-green-600">Using worker pool</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Document Preview for Upload - with progressive loading */}
                {showEnhancePreview && enhanceContent && enhanceInputMethod === "upload" && (
                  <ProgressiveDocumentPreview content={enhanceContent} maxHeight={400} className="mt-4" />
                )}
              </TabsContent>

              <TabsContent value="paste" className="mt-0">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pasted-jd" className="font-medium">
                      Paste your Job Description
                    </Label>
                    <Textarea
                      id="pasted-jd"
                      placeholder="Paste your existing job description here..."
                      value={pastedJDContent}
                      onChange={handlePastedContentChange}
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500">
                      Paste the complete text of your job description. Our AI will analyze and enhance it.
                    </p>
                  </div>

                  {/* Preview for Pasted Content - with progressive loading */}
                  {pastedJDContent.trim() && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEnhancePreview(!showEnhancePreview)}
                        className="text-slate-500 hover:text-slate-700 flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {showEnhancePreview ? "Hide Preview" : "Preview"}
                      </Button>
                    </div>
                  )}

                  {showEnhancePreview && pastedJDContent.trim() && enhanceInputMethod === "paste" && (
                    <ProgressiveDocumentPreview content={pastedJDContent} maxHeight={400} className="mt-4" />
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {enhanceError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm">{enhanceError}</p>
              </div>
            )}

            <Button
              className="w-full bg-atlan-primary hover:bg-atlan-primary-dark text-white"
              onClick={handleEnhanceJD}
              disabled={
                (enhanceInputMethod === "upload" && (!enhanceContent || isParsing || processingChunks)) ||
                (enhanceInputMethod === "paste" && !pastedJDContent.trim()) ||
                isEnhancing
              }
            >
              {isEnhancing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {processingStage ? processingStage : "Enhancing JD..."}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Enhance JD {usingWorker && <Zap className="ml-1 h-3 w-3" />}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default JDBuilderForm

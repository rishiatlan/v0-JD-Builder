"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import dynamic from "next/dynamic"
import { documentCache } from "@/lib/document-cache"
import { analytics } from "@/lib/analytics"
import { useToast } from "@/components/ui/use-toast"

// Dynamically import document parsing libraries to ensure they only load on the client
const mammoth = dynamic(() => import("mammoth"), { ssr: false })
const pdfjs = dynamic(() => import("pdfjs-dist"), { ssr: false })

interface DocumentParserProps {
  file: File | null
  onContentParsed: (content: string) => void
  onError: (error: string) => void
}

export function DocumentParser({ file, onContentParsed, onError }: DocumentParserProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const { toast } = useToast()
  const [isProcessed, setIsProcessed] = useState(false)

  // Memoize the parse function to avoid recreating it on each render
  const parseDocument = useCallback(
    async (fileToProcess: File) => {
      // If we've already processed this file, don't do it again
      if (isProcessed) return

      setIsLoading(true)
      setStatus("loading")
      setProgress(5)
      setErrorDetails(null)
      setIsProcessed(true) // Mark as processed

      try {
        // Check if we already have this document in cache
        const cachedDocument = documentCache.getDocumentByFilename(fileToProcess.name)

        if (cachedDocument) {
          // Use cached content
          setProgress(90)
          analytics.track("document_parse_success", {
            source: "cache",
            fileType: fileToProcess.type,
            fileSize: fileToProcess.size,
          })

          setTimeout(() => {
            setProgress(100)
            setStatus("success")
            setIsLoading(false)
            onContentParsed(cachedDocument.content)
            // Remove toast notification from here - we'll handle it at a higher level
          }, 300) // Small delay for UX

          return
        }

        let content = ""

        // Handle different file types
        if (fileToProcess.name.endsWith(".txt")) {
          content = await parseTextFile(fileToProcess)
        } else if (fileToProcess.name.endsWith(".docx")) {
          content = await parseDocxFile(fileToProcess)
        } else if (fileToProcess.name.endsWith(".pdf")) {
          content = await parsePdfFile(fileToProcess)
        } else {
          throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.")
        }

        if (content.trim() === "") {
          throw new Error("Could not extract any text content from the file.")
        }

        // Cache the parsed document
        await documentCache.cacheDocument(fileToProcess, content)

        analytics.track("document_parse_success", {
          source: "new_parse",
          fileType: fileToProcess.type,
          fileSize: fileToProcess.size,
        })

        setProgress(100)
        setStatus("success")
        onContentParsed(content)
        // Remove toast notification from here - we'll handle it at a higher level
      } catch (error) {
        console.error("Error parsing document:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to parse document"
        setErrorDetails(errorMessage)
        setStatus("error")
        onError(errorMessage)

        analytics.track("document_parse_failed", {
          fileType: fileToProcess.type,
          fileSize: fileToProcess.size,
          error: errorMessage,
        })
      } finally {
        setIsLoading(false)
      }
    },
    [onContentParsed, onError, isProcessed],
  )

  // Parse text files using FileReader
  const parseTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        if (event.target?.result) {
          setProgress(80)
          resolve(event.target.result.toString())
        } else {
          reject(new Error("Failed to read text file"))
        }
      }

      reader.onerror = () => reject(reader.error || new Error("Failed to read text file"))
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentLoaded = Math.round((event.loaded / event.total) * 70) + 10
          setProgress(percentLoaded)
        }
      }

      reader.readAsText(file)
    })
  }

  // Parse DOCX files using mammoth.js
  const parseDocxFile = async (file: File): Promise<string> => {
    setProgress(20)

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            setProgress(40)
            const arrayBuffer = event.target.result as ArrayBuffer

            // Dynamically import mammoth only when needed
            const mammothModule = await import("mammoth")
            setProgress(60)

            const result = await mammothModule.extractRawText({ arrayBuffer })
            setProgress(80)

            resolve(result.value)
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error("Failed to read DOCX file"))
        }
      }

      reader.onerror = () => reject(reader.error || new Error("Failed to read DOCX file"))
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentLoaded = Math.round((event.loaded / event.total) * 30) + 10
          setProgress(percentLoaded)
        }
      }

      reader.readAsArrayBuffer(file)
    })
  }

  // Parse PDF files using pdf.js
  const parsePdfFile = async (file: File): Promise<string> => {
    setProgress(20)

    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (event) => {
        if (event.target?.result) {
          try {
            setProgress(30)
            const arrayBuffer = event.target.result as ArrayBuffer

            // Dynamically import and initialize pdf.js
            const pdfjs = await import("pdfjs-dist")
            setProgress(40)

            // Set the worker source
            const pdfjsWorker = await import("pdfjs-dist/build/pdf.worker.mjs")
            pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

            setProgress(50)
            const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
            setProgress(60)

            let textContent = ""
            const totalPages = pdf.numPages

            // Extract text from each page
            for (let i = 1; i <= totalPages; i++) {
              setProgress(60 + Math.floor((i / totalPages) * 30))
              const page = await pdf.getPage(i)
              const content = await page.getTextContent()
              const pageText = content.items.map((item: any) => item.str).join(" ")

              textContent += pageText + "\n\n"
            }

            resolve(textContent)
          } catch (error) {
            reject(error)
          }
        } else {
          reject(new Error("Failed to read PDF file"))
        }
      }

      reader.onerror = () => reject(reader.error || new Error("Failed to read PDF file"))
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentLoaded = Math.round((event.loaded / event.total) * 20) + 10
          setProgress(percentLoaded)
        }
      }

      reader.readAsArrayBuffer(file)
    })
  }

  // Effect to trigger parsing when file changes
  useEffect(() => {
    if (file) {
      setIsProcessed(false) // Reset the processed flag for new files
      parseDocument(file)

      analytics.track("document_upload", {
        fileType: file.type,
        fileSize: file.size,
        fileName: file.name,
      })
    }
  }, [file, parseDocument])

  if (!isLoading && status === "idle") return null

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {status === "loading" && (
        <>
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-atlan-primary" />
            <span className="text-sm font-medium">Parsing document... {progress}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full mt-2">
            <div
              className="h-full bg-atlan-primary rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </>
      )}

      {status === "success" && (
        <div className="flex items-center text-green-600">
          <CheckCircle className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Document parsed successfully</span>
        </div>
      )}

      {status === "error" && (
        <div className="w-full p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to parse document</p>
              {errorDetails && <p className="text-xs text-red-600 mt-1">{errorDetails}</p>}
              <button
                className="text-xs text-atlan-primary mt-2 underline"
                onClick={() => {
                  if (file) {
                    parseDocument(file)
                    toast({
                      title: "Retrying",
                      description: "Attempting to parse the document again...",
                    })
                  }
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

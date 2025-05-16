"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"
import { logMemoryUsage } from "@/lib/memory-optimization"
import useWorkerPool from "@/hooks/use-worker-pool"
import { TaskPriority } from "@/lib/worker-pool"
import { createDocumentParserWorker, parseDocxWithWorker, terminateWorker } from "@/lib/worker-manager"

interface EnhancedDocumentParserProps {
  file: File | null
  onContentParsed: (content: string) => void
  onError: (errorMessage: string) => void
  onParsingStart: () => void
  onParsingComplete: () => void
}

export function EnhancedDocumentParser({
  file,
  onContentParsed,
  onError,
  onParsingStart,
  onParsingComplete,
}: EnhancedDocumentParserProps) {
  const parsedFileRef = useRef<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<string | undefined>(undefined)
  const workerRef = useRef<Worker | null>(null)
  const {
    parseTextFile,
    parsePdfFile,
    isProcessing: isPoolProcessing,
    progress: poolProgress,
    stage: poolStage,
    error: poolError,
  } = useWorkerPool()

  // Cleanup function for worker
  const cleanupWorker = () => {
    if (workerRef.current) {
      terminateWorker(workerRef.current)
      workerRef.current = null
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return cleanupWorker
  }, [])

  useEffect(() => {
    // Only parse if we have a file and it's different from the last one we parsed
    if (!file || file === parsedFileRef.current) return

    const parseFile = async () => {
      setIsProcessing(true)
      setProgress(0)
      setStage(undefined)
      onParsingStart()

      try {
        logMemoryUsage("Before parsing")
        let content = ""

        // Parse based on file type using worker pool
        if (file.type === "text/plain") {
          parseTextFile(file, {
            priority: TaskPriority.HIGH,
            onProgress: (progress, stage) => {
              setProgress(progress)
              if (stage) setStage(stage)
            },
            onComplete: (result) => {
              if (result) {
                onContentParsed(result)
                parsedFileRef.current = file
              } else {
                onError("Failed to extract content from file")
              }
              setIsProcessing(false)
              setProgress(100)
              onParsingComplete()
              logMemoryUsage("After parsing")
            },
            onError: (error) => {
              console.error("Error parsing file:", error)
              onError(error)
              setIsProcessing(false)
              onParsingComplete()
            },
          })
        } else if (file.type === "application/pdf") {
          parsePdfFile(file, {
            priority: TaskPriority.HIGH,
            onProgress: (progress, stage) => {
              setProgress(progress)
              if (stage) setStage(stage)
            },
            onComplete: (result) => {
              if (result) {
                onContentParsed(result)
                parsedFileRef.current = file
              } else {
                onError("Failed to extract content from file")
              }
              setIsProcessing(false)
              setProgress(100)
              onParsingComplete()
              logMemoryUsage("After parsing")
            },
            onError: (error) => {
              console.error("Error parsing file:", error)
              onError(error)
              setIsProcessing(false)
              onParsingComplete()
            },
          })
        } else if (
          file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          file.type === "application/msword"
        ) {
          // For DOCX files, we'll use our specialized DOCX parser
          setStage("Parsing DOCX document")

          try {
            // Create a worker if we don't have one
            if (!workerRef.current) {
              workerRef.current = createDocumentParserWorker()
            }

            if (workerRef.current) {
              // Use our specialized DOCX parser
              content = await parseDocxWithWorker(
                workerRef.current,
                file,
                (progress) => {
                  setProgress(progress)
                },
                (error) => {
                  console.error("DOCX parsing error:", error)
                  onError(error)
                },
              )

              if (content) {
                onContentParsed(content)
                parsedFileRef.current = file
              } else {
                throw new Error("Failed to extract content from DOCX file")
              }
            } else {
              // Fallback to direct mammoth usage if worker creation failed
              content = await parseDocxFile(file)

              if (content) {
                onContentParsed(content)
                parsedFileRef.current = file
              } else {
                throw new Error("Failed to extract content from DOCX file")
              }
            }
          } catch (error) {
            console.error("Error parsing DOCX:", error)
            onError(error instanceof Error ? error.message : "Failed to parse DOCX file")

            // Try the fallback method if the worker method failed
            try {
              content = await parseDocxFile(file)

              if (content) {
                onContentParsed(content)
                parsedFileRef.current = file
              } else {
                throw new Error("Failed to extract content from DOCX file")
              }
            } catch (fallbackError) {
              console.error("Fallback DOCX parsing error:", fallbackError)
              onError("Failed to parse DOCX file. The file may be corrupted or in an unsupported format.")
            }
          }

          setIsProcessing(false)
          setProgress(100)
          onParsingComplete()
          logMemoryUsage("After parsing")
        } else {
          throw new Error("Unsupported file type")
        }
      } catch (error) {
        console.error("Error parsing file:", error)
        onError(error instanceof Error ? error.message : "Failed to parse file")
        setIsProcessing(false)
        onParsingComplete()
      }
    }

    parseFile()
  }, [file, onContentParsed, onError, onParsingStart, onParsingComplete, parseTextFile, parsePdfFile])

  // Parse DOCX file
  const parseDocxFile = async (file: File): Promise<string> => {
    try {
      setStage("Parsing DOCX document")

      // Dynamically import mammoth
      const mammoth = await import("mammoth")

      // Read the file as an array buffer
      const arrayBuffer = await file.arrayBuffer()

      // Update progress
      setProgress(30)
      setStage("Extracting text from DOCX")

      // Extract text from the DOCX file
      const result = await mammoth.extractRawText({ arrayBuffer })

      // Update progress
      setProgress(70)
      setStage("Processing extracted text")

      // Check if we got valid content
      if (!result.value || result.value.trim().length === 0) {
        throw new Error("No text content could be extracted from the DOCX file.")
      }

      // If there are any warnings, log them
      if (result.messages && result.messages.length > 0) {
        console.warn("DOCX parsing warnings:", result.messages)
      }

      // Update progress
      setProgress(100)

      return result.value
    } catch (error) {
      console.error("DOCX parsing error:", error)
      throw new Error("Failed to parse DOCX file. The file may be corrupted or in an unsupported format.")
    }
  }

  // Render loading indicator if processing
  if (isProcessing || isPoolProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="w-full max-w-xs bg-slate-100 rounded-full h-2.5 mb-4">
          <div
            className="bg-atlan-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${isPoolProcessing ? poolProgress : progress}%` }}
          ></div>
        </div>
        <div className="flex items-center">
          <Loader2 className="h-6 w-6 animate-spin text-atlan-primary mr-2" />
          <span className="text-sm text-slate-600">
            {isPoolProcessing && poolStage
              ? `${poolStage}... ${poolProgress}%`
              : stage
                ? `${stage}... ${progress}%`
                : `Parsing document... ${progress}%`}
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">Using worker pool for background processing</div>
      </div>
    )
  }

  return null // This component doesn't render anything when not processing
}

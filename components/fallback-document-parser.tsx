"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Cpu } from "lucide-react"
import { logMemoryUsage, isMemoryUsageHigh } from "@/lib/memory-optimization"
import {
  isWorkerSupported,
  createDocumentParserWorker,
  parseTextWithWorker,
  cancelWorkerOperation,
  terminateWorker,
} from "@/lib/worker-manager"

interface FallbackDocumentParserProps {
  file: File | null
  onContentParsed: (content: string) => void
  onError: (errorMessage: string) => void
  onParsingStart: () => void
  onParsingComplete: () => void
}

export function FallbackDocumentParser({
  file,
  onContentParsed,
  onError,
  onParsingStart,
  onParsingComplete,
}: FallbackDocumentParserProps) {
  const parsedFileRef = useRef<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<string | undefined>(undefined)
  const workerRef = useRef<Worker | null>(null)
  const [usingWorker, setUsingWorker] = useState(false)

  // Cleanup function
  const cleanup = () => {
    if (workerRef.current) {
      cancelWorkerOperation(workerRef.current)
      terminateWorker(workerRef.current)
      workerRef.current = null
    }
  }

  // Check if web workers are supported
  useEffect(() => {
    setUsingWorker(isWorkerSupported)

    // Cleanup on unmount
    return cleanup
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
        logMemoryUsage("Before parsing (fallback)")

        // Check if we can use web workers
        if (usingWorker) {
          // Create a new worker if needed
          if (!workerRef.current) {
            workerRef.current = createDocumentParserWorker()
          }

          if (workerRef.current) {
            try {
              setStage("Parsing with web worker")

              // Parse text using worker
              const content = await parseTextWithWorker(
                workerRef.current,
                file,
                32 * 1024, // 32KB chunks
                (progress) => {
                  setProgress(progress)
                },
                (error) => onError(error),
              )

              onContentParsed(content)
              parsedFileRef.current = file
            } catch (error: any) {
              console.warn("Worker parsing failed, falling back to main thread:", error)

              // Fall back to main thread parsing
              await parseFileMainThread()
            }
          } else {
            // If worker creation failed, fall back to main thread
            console.warn("Worker creation failed, falling back to main thread")
            await parseFileMainThread()
          }
        } else {
          // If workers aren't supported, use main thread
          await parseFileMainThread()
        }

        logMemoryUsage("After parsing (fallback)")
      } catch (error: any) {
        console.error("Error parsing file:", error)
        onError(error instanceof Error ? error.message : "Failed to parse file")
      } finally {
        setIsProcessing(false)
        setProgress(100)
        setStage(undefined)
        onParsingComplete()
      }
    }

    // Parse file on the main thread
    const parseFileMainThread = async () => {
      setStage("Parsing in main thread")

      try {
        // For large files, use streaming approach
        if (file.size > 1 * 1024 * 1024) {
          // 1MB threshold
          const content = await parseFileStreaming()
          onContentParsed(content)
          parsedFileRef.current = file
        } else {
          // For smaller files, use the simple approach
          if (file.type === "text/plain") {
            const content = await readFileAsText(file)
            onContentParsed(content)
            parsedFileRef.current = file
          } else if (file.type === "application/pdf") {
            // For PDFs, we'll warn the user and try to extract text
            const content = await readFileAsText(file)

            if (content.length < 100 || !isReadableText(content)) {
              onContentParsed(
                "PDF content could not be fully extracted in basic mode. For better results, try using a modern browser that supports enhanced parsing.",
              )
              onError("Limited PDF support in basic mode. Some content may be missing or unreadable.")
            } else {
              onContentParsed(content)
            }
            parsedFileRef.current = file
          } else if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.type === "application/msword"
          ) {
            // For Word docs, provide a more helpful message
            onContentParsed(
              "DOCX/DOC parsing requires the enhanced parser which isn't available in your browser. " +
                "Please try using a different browser, or copy and paste the content manually.",
            )
            onError(
              "DOCX/DOC parsing is not supported in basic mode. Please use a modern browser or paste content manually.",
            )
            parsedFileRef.current = file
          } else {
            throw new Error("Unsupported file type")
          }
        }
      } catch (error) {
        console.error("Error in main thread parsing:", error)
        throw error
      }
    }

    // Parse file using streaming for large files
    const parseFileStreaming = async (): Promise<string> => {
      return new Promise((resolve, reject) => {
        const chunkSize = 32 * 1024 // 32KB chunks
        const fileSize = file.size
        let offset = 0
        let result = ""

        // Function to read the next chunk
        const readNextChunk = () => {
          if (offset >= fileSize) {
            resolve(result)
            return
          }

          // Check memory usage before processing next chunk
          if (isMemoryUsageHigh(90)) {
            // Wait for garbage collection
            setTimeout(() => {
              readNextChunk()
            }, 200)
            return
          }

          const slice = file.slice(offset, offset + chunkSize)
          const reader = new FileReader()

          reader.onload = (e: any) => {
            const text = e.target?.result as string
            result += text
            offset += chunkSize

            // Update progress
            const progress = Math.min(100, Math.round((offset / fileSize) * 100))
            setProgress(progress)

            // Continue with next chunk after a small delay
            setTimeout(readNextChunk, 10)
          }

          reader.onerror = reject
          reader.readAsText(slice)
        }

        // Start reading chunks
        readNextChunk()
      })
    }

    parseFile()
  }, [file, onContentParsed, onError, onParsingStart, onParsingComplete, usingWorker])

  // Read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e: any) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error("Failed to read file"))
      reader.readAsText(file)
    })
  }

  // Check if text is readable (contains enough readable characters)
  const isReadableText = (text: string): boolean => {
    // Count readable characters (letters, numbers, punctuation)
    const readableChars = text.replace(/[^a-zA-Z0-9.,;:!? ]/g, "").length
    return readableChars > text.length * 0.5 // At least 50% should be readable
  }

  // Render loading indicator if processing
  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-4">
        <div className="w-full max-w-xs bg-slate-100 rounded-full h-2.5 mb-4">
          <div
            className="bg-atlan-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex items-center">
          <Loader2 className="h-6 w-6 animate-spin text-atlan-primary mr-2" />
          <span className="text-sm text-slate-600">
            {stage ? `${stage}... ${progress}%` : `Processing document... ${progress}%`}
          </span>
        </div>
        {usingWorker && (
          <div className="flex items-center mt-2">
            <Cpu className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-xs text-green-600">Using web worker for background processing</span>
          </div>
        )}
      </div>
    )
  }

  return null // This component doesn't render anything when not processing
}

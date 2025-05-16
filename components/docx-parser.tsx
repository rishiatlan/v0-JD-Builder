"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface DocxParserProps {
  file: File | null
  onContentParsed: (content: string) => void
  onError: (errorMessage: string) => void
  onParsingStart: () => void
  onParsingComplete: () => void
}

export function DocxParser({ file, onContentParsed, onError, onParsingStart, onParsingComplete }: DocxParserProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<string>("Initializing")

  useEffect(() => {
    if (!file) return

    const parseDocx = async () => {
      try {
        setIsProcessing(true)
        setProgress(0)
        setStage("Starting DOCX parsing")
        onParsingStart()

        // Load the mammoth.js library dynamically
        setStage("Loading document parser")
        setProgress(10)
        const mammoth = await import("mammoth")

        setStage("Reading file")
        setProgress(20)
        const arrayBuffer = await file.arrayBuffer()

        setStage("Extracting text from DOCX")
        setProgress(40)

        // Use a timeout to allow UI to update
        await new Promise((resolve) => setTimeout(resolve, 100))

        // Extract text from the DOCX file
        const result = await mammoth.extractRawText({ arrayBuffer })

        setStage("Processing extracted content")
        setProgress(80)

        // Check if we got valid content
        if (!result.value || result.value.trim().length === 0) {
          throw new Error("No text content could be extracted from the DOCX file.")
        }

        // If there are any warnings, log them
        if (result.messages && result.messages.length > 0) {
          console.warn("DOCX parsing warnings:", result.messages)
        }

        setStage("Finalizing")
        setProgress(100)

        // Return the extracted text
        onContentParsed(result.value)
        onParsingComplete()
      } catch (error) {
        console.error("Error parsing DOCX:", error)
        onError(error instanceof Error ? error.message : "Failed to parse DOCX file")

        // Try alternative parsing method
        try {
          setStage("Trying alternative parsing method")
          setProgress(30)

          // Use docx2html as a fallback
          const docx2html = await import("docx2html")
          const arrayBuffer = await file.arrayBuffer()

          setProgress(50)
          const htmlResult = await docx2html.default(arrayBuffer)

          setProgress(70)
          // Convert HTML to plain text
          const tempDiv = document.createElement("div")
          tempDiv.innerHTML = htmlResult
          const text = tempDiv.textContent || tempDiv.innerText || ""

          if (text.trim().length === 0) {
            throw new Error("No text content could be extracted from the DOCX file.")
          }

          setProgress(100)
          onContentParsed(text)
          onParsingComplete()
        } catch (fallbackError) {
          console.error("Fallback parsing failed:", fallbackError)
          onError("All parsing methods failed. The file may be corrupted or in an unsupported format.")
          onParsingComplete()
        }
      } finally {
        setIsProcessing(false)
      }
    }

    parseDocx()
  }, [file, onContentParsed, onError, onParsingStart, onParsingComplete])

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
            {stage}... {progress}%
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-500">Using direct client-side parsing</div>
      </div>
    )
  }

  return null
}

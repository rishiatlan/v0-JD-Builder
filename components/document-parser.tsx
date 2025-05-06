"use client"

import { useEffect, useRef } from "react"

interface DocumentParserProps {
  file: File | null
  onContentParsed: (content: string) => void
  onError: (errorMessage: string) => void
}

export function DocumentParser({ file, onContentParsed, onError }: DocumentParserProps) {
  // Use a ref to track if we've already parsed this file
  const parsedFileRef = useRef<File | null>(null)

  useEffect(() => {
    // Only parse if we have a file and it's different from the last one we parsed
    if (!file || file === parsedFileRef.current) return

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        if (content) {
          onContentParsed(content)
          // Update our ref to track that we've parsed this file
          parsedFileRef.current = file
        }
      } catch (error) {
        onError("Failed to read file content.")
      }
    }

    reader.onerror = () => {
      onError("Failed to read file.")
    }

    if (file.type === "text/plain") {
      reader.readAsText(file)
    } else if (file.type === "application/pdf") {
      // Basic PDF reading (consider using a library for more robust parsing)
      reader.readAsText(file)
      onError("PDF parsing is not fully supported. Results may vary.")
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/msword"
    ) {
      // Basic DOCX reading (consider using a library for more robust parsing)
      reader.readAsText(file)
      onError("DOCX parsing is not fully supported. Results may vary.")
    } else {
      onError("Unsupported file type.")
    }
  }, [file, onContentParsed, onError])

  return null // This component doesn't render anything
}

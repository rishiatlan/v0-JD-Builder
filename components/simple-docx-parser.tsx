"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Loader2, Upload, FileText, X, Check, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SimpleDocxParser({ onParsedContent }: { onParsedContent: (content: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [parsedContent, setParsedContent] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setParsedContent(null)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      setFile(droppedFile)
      setError(null)
      setParsedContent(null)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleRemoveFile = () => {
    setFile(null)
    setParsedContent(null)
    setError(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const parseDocx = async () => {
    if (!file) return

    try {
      setIsParsing(true)
      setError(null)
      setProgress(10)

      // Read the file as an ArrayBuffer
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer)
        reader.onerror = (e) => reject(new Error("Failed to read file"))
        reader.readAsArrayBuffer(file)
      })

      setProgress(30)

      // Load the mammoth.js script dynamically
      if (!window.mammoth) {
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"
        script.async = true

        await new Promise((resolve, reject) => {
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      setProgress(50)

      // Use mammoth to extract text
      const result = await window.mammoth.extractRawText({ arrayBuffer })

      setProgress(80)

      if (!result.value || result.value.trim() === "") {
        throw new Error("No text content could be extracted from the document")
      }

      setParsedContent(result.value)
      onParsedContent(result.value)
      setProgress(100)
    } catch (err) {
      console.error("Error parsing DOCX:", err)
      setError(err instanceof Error ? err.message : "Failed to parse document")
    } finally {
      setIsParsing(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!file ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".docx" className="hidden" />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">Upload your document</h3>
          <p className="text-sm text-gray-500">Drag and drop or click to upload a DOCX file</p>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-atlan-primary mr-2" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {file.type || "application/docx"} • {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-gray-500 hover:text-gray-700"
              disabled={isParsing}
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!isParsing && !parsedContent && !error && (
            <Button onClick={parseDocx} className="w-full mt-2">
              Parse Document
            </Button>
          )}

          {isParsing && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-atlan-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-atlan-primary mr-2" />
                <span className="text-sm text-gray-600">Parsing document... {progress}%</span>
              </div>
            </div>
          )}

          {parsedContent && (
            <div className="mt-4 p-3 bg-green-50 rounded-md flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Document parsed successfully!</p>
                <p className="text-xs text-green-700 mt-1">{parsedContent.length} characters extracted</p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-md flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Error parsing document</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
                <Button variant="outline" size="sm" onClick={parseDocx} className="mt-2">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {parsedContent && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
              <div className="max-h-60 overflow-y-auto p-3 bg-gray-50 rounded-md text-sm">
                {parsedContent.split("\n").map((line, i) => (
                  <p key={i} className={line.trim() === "" ? "h-4" : ""}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, FileText, X } from "lucide-react"
import { DocxParser } from "./docx-parser"
import { EnhancedDocumentParser } from "./enhanced-document-parser"

interface DocumentUploadProps {
  onDocumentParsed: (content: string) => void
}

export function DocumentUpload({ onDocumentParsed }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedContent, setParsedContent] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setIsUploading(true)

      // Reset after a short delay to simulate upload
      setTimeout(() => {
        setIsUploading(false)
        setIsParsing(true)
      }, 500)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0] || null
    if (droppedFile) {
      setFile(droppedFile)
      setError(null)
      setIsUploading(true)

      // Reset after a short delay to simulate upload
      setTimeout(() => {
        setIsUploading(false)
        setIsParsing(true)
      }, 500)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleRemoveFile = () => {
    setFile(null)
    setParsedContent(null)
    setError(null)
    setIsParsing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleContentParsed = (content: string) => {
    setParsedContent(content)
    onDocumentParsed(content)
  }

  const handleParsingError = (errorMessage: string) => {
    setError(errorMessage)
    setIsParsing(false)
  }

  const handleParsingStart = () => {
    setIsParsing(true)
    setError(null)
  }

  const handleParsingComplete = () => {
    setIsParsing(false)
  }

  return (
    <div className="w-full">
      {!file ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">Upload your document</h3>
          <p className="text-sm text-gray-500">Drag and drop or click to upload a PDF, DOCX, or TXT file</p>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-atlan-primary mr-2" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {file.type} • {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button onClick={handleRemoveFile} className="text-gray-500 hover:text-gray-700" disabled={isParsing}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {isParsing && (
            <>
              {file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ? (
                <DocxParser
                  file={file}
                  onContentParsed={handleContentParsed}
                  onError={handleParsingError}
                  onParsingStart={handleParsingStart}
                  onParsingComplete={handleParsingComplete}
                />
              ) : (
                <EnhancedDocumentParser
                  file={file}
                  onContentParsed={handleContentParsed}
                  onError={handleParsingError}
                  onParsingStart={handleParsingStart}
                  onParsingComplete={handleParsingComplete}
                />
              )}
            </>
          )}

          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

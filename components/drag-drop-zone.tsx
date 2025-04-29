"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Upload, File } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DragDropZoneProps {
  onFileSelected: (file: File) => void
  accept: string
  maxSize?: number // in bytes
}

export function DragDropZone({ onFileSelected, accept, maxSize = 10 * 1024 * 1024 }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragError, setDragError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    setDragError(null)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDragging) {
        setIsDragging(true)
      }
    },
    [isDragging],
  )

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file size
      if (maxSize && file.size > maxSize) {
        return `File size exceeds ${maxSize / (1024 * 1024)}MB limit`
      }

      // Check file type
      const acceptedTypes = accept.split(",").map((type) => type.trim())
      const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()

      // Check if the file extension is in the accepted types
      const isValidExtension = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return fileExtension === type
        } else if (type.includes("/*")) {
          const mainType = type.split("/")[0]
          return file.type.startsWith(`${mainType}/`)
        } else {
          return file.type === type
        }
      })

      if (!isValidExtension) {
        return "Invalid file type. Please upload a supported file type."
      }

      return null
    },
    [accept, maxSize],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0]
        const error = validateFile(file)

        if (error) {
          setDragError(error)
          return
        }

        onFileSelected(file)
      }
    },
    [onFileSelected, validateFile],
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0]
        const error = validateFile(file)

        if (error) {
          setDragError(error)
          return
        }

        onFileSelected(file)
      }
    },
    [onFileSelected, validateFile],
  )

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors ${
        isDragging
          ? "border-atlan-primary bg-atlan-primary/5"
          : dragError
            ? "border-red-300 bg-red-50"
            : "border-slate-300"
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      aria-label="File upload area"
      role="button"
      tabIndex={0}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          fileInputRef.current?.click()
        }
      }}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className={`p-3 rounded-full ${isDragging ? "bg-atlan-primary/20" : "bg-slate-100"}`}>
          {dragError ? (
            <File className="h-8 w-8 text-red-500" />
          ) : (
            <Upload className={`h-8 w-8 ${isDragging ? "text-atlan-primary" : "text-atlan-primary"}`} />
          )}
        </div>
        <div>
          <h3 className="text-lg font-medium">
            {dragError ? "Invalid File" : isDragging ? "Drop file here" : "Upload your document"}
          </h3>
          {!dragError && (
            <p className="text-sm text-slate-500 mt-1">Drag and drop or click to upload a PDF, DOCX, or TXT file</p>
          )}
          {dragError && <p className="text-sm text-red-600 mt-1">{dragError}</p>}
        </div>
        <input
          ref={fileInputRef}
          id="file-upload"
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileInputChange}
          aria-label="File upload input"
        />
        {!isDragging && (
          <Button
            variant="outline"
            className="border-atlan-primary text-atlan-primary hover:bg-atlan-primary/10"
            onClick={(e) => {
              e.stopPropagation()
              fileInputRef.current?.click()
            }}
          >
            Select File
          </Button>
        )}
      </div>
    </div>
  )
}

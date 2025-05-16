"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

interface DocumentPreviewProps {
  content: string | null
}

export function DocumentPreview({ content }: DocumentPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!content) return null

  // Limit preview to first 500 characters when collapsed
  const previewContent = isExpanded ? content : content.substring(0, 500) + (content.length > 500 ? "..." : "")

  return (
    <div className="mt-4 border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium text-gray-700">Document Preview</h3>
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-sm text-atlan-primary flex items-center">
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" /> Show Less
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" /> Show More
            </>
          )}
        </button>
      </div>
      <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap font-mono">{previewContent}</div>
    </div>
  )
}

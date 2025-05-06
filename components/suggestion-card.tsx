"use client"

import { CheckCircle, RefreshCw } from "lucide-react"
import { EnhancedButton } from "./ui/button-enhancement"
import { CardEnhancement } from "./ui/card-enhancement"

interface SuggestionCardProps {
  suggestion: {
    section: string
    original: string
    suggestion: string
    reason: string
  }
  isApplied: boolean
  onApply: () => void
}

export function SuggestionCard({ suggestion, isApplied, onApply }: SuggestionCardProps) {
  return (
    <CardEnhancement bordered hoverable className="p-4 mb-4">
      <div className="flex items-start">
        <RefreshCw className="h-5 w-5 text-atlan-primary mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium mb-3">Suggested improvement:</p>

          <div className="mb-4 space-y-3">
            <div className="p-3 bg-red-50 border-l-2 border-red-300 rounded-r-md">
              <span className="text-xs text-red-600 font-medium block mb-1">Original:</span>
              <p className="text-sm text-slate-700">{suggestion.original}</p>
            </div>

            <div className="p-3 bg-green-50 border-l-2 border-green-400 rounded-r-md">
              <span className="text-xs text-green-600 font-medium block mb-1">Suggestion:</span>
              <p className="text-sm text-slate-700 italic">{suggestion.suggestion}</p>
            </div>
          </div>

          <div className="bg-blue-50 p-2 rounded-md mb-4">
            <p className="text-xs text-blue-700">
              <span className="font-medium">Reason:</span> {suggestion.reason}
            </p>
          </div>

          <div className="flex justify-end">
            {isApplied ? (
              <div className="flex items-center text-green-600 text-sm">
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Applied
              </div>
            ) : (
              <EnhancedButton size="sm" onClick={onApply} icon={<CheckCircle className="h-3.5 w-3.5" />}>
                Apply Suggestion
              </EnhancedButton>
            )}
          </div>
        </div>
      </div>
    </CardEnhancement>
  )
}

"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { isStringTooLarge } from "@/lib/memory-optimization"
import useWorkerPool from "@/hooks/use-worker-pool"
import { TaskPriority } from "@/lib/worker-pool"

interface ProgressiveDocumentPreviewProps {
  content: string
  maxHeight?: number
  className?: string
}

export function ProgressiveDocumentPreview({
  content,
  maxHeight = 400,
  className = "",
}: ProgressiveDocumentPreviewProps) {
  const [lines, setLines] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingStage, setLoadingStage] = useState<string | undefined>("Preparing content")
  const parentRef = useRef<HTMLDivElement>(null)
  const { processText, isProcessing, progress, stage, error } = useWorkerPool()

  // Process content in chunks
  useEffect(() => {
    if (!content) {
      setLines([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setLoadingProgress(0)
    setLoadingStage("Preparing content")

    // For large content, use worker pool
    if (isStringTooLarge(content.length)) {
      processText(
        content,
        10000, // 10KB chunks
        {
          priority: TaskPriority.LOW, // Lower priority for preview tasks
          onProgress: (progress, stage) => {
            setLoadingProgress(progress)
            if (stage) setLoadingStage(stage)
          },
          onComplete: (processedContent) => {
            // Split into lines
            const contentLines = processedContent.split("\n")
            setLines(contentLines)
            setIsLoading(false)
          },
          onError: (error) => {
            console.error("Error processing content:", error)
            // Fall back to simple splitting for preview
            const contentLines = content.split("\n")
            setLines(contentLines)
            setIsLoading(false)
          },
        },
      )
    } else {
      // For smaller content, process directly
      try {
        // Split into lines
        const contentLines = content.split("\n")
        setLines(contentLines)
        setIsLoading(false)
      } catch (error) {
        console.error("Error splitting content:", error)
        setLines(["Error processing content for preview"])
        setIsLoading(false)
      }
    }

    // Cleanup function
    return () => {
      setLines([])
    }
  }, [content, processText])

  // Set up virtualization
  const rowVirtualizer = useVirtualizer({
    count: lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 24, // Estimated line height
    overscan: 10, // Number of items to render outside of the visible area
  })

  // Calculate total height
  const totalHeight = rowVirtualizer.getTotalSize()

  // Get virtualized items
  const virtualItems = rowVirtualizer.getVirtualItems()

  // Format line numbers with padding
  const lineNumberWidth = useMemo(() => {
    return lines.length.toString().length * 10 + 20
  }, [lines.length])

  // Render loading state
  if (isLoading) {
    return (
      <div className={`border border-slate-200 rounded-md p-4 bg-slate-50 ${className}`}>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-full max-w-xs bg-slate-100 rounded-full h-2.5 mb-4">
            <div
              className="bg-atlan-primary h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${isProcessing ? progress : loadingProgress}%` }}
            ></div>
          </div>
          <div className="flex items-center">
            <Loader2 className="h-6 w-6 animate-spin text-atlan-primary mr-2" />
            <span className="text-sm text-slate-600">
              {isProcessing && stage
                ? `${stage}... ${progress}%`
                : loadingStage
                  ? `${loadingStage}... ${loadingProgress}%`
                  : `Loading preview... ${loadingProgress}%`}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Render empty state
  if (lines.length === 0) {
    return (
      <div className={`border border-slate-200 rounded-md p-4 bg-slate-50 ${className}`}>
        <p className="text-center text-slate-500 py-8">No content to preview</p>
      </div>
    )
  }

  // Render content
  return (
    <div className={`border border-slate-200 rounded-md bg-slate-50 ${className}`}>
      <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200 bg-slate-100">
        <h4 className="font-medium text-sm">Document Preview</h4>
        <span className="text-xs text-slate-500">
          {lines.length.toLocaleString()} line{lines.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Virtualized content */}
      <div
        ref={parentRef}
        className="overflow-auto font-mono text-sm"
        style={{
          height: maxHeight,
          width: "100%",
        }}
      >
        <div
          className="relative w-full"
          style={{
            height: `${totalHeight}px`,
          }}
        >
          {virtualItems.map((virtualItem) => (
            <div
              key={virtualItem.key}
              className="absolute top-0 left-0 w-full flex"
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div
                className="flex-shrink-0 text-right pr-2 text-slate-400 select-none border-r border-slate-200"
                style={{ width: lineNumberWidth }}
              >
                {virtualItem.index + 1}
              </div>
              <div className="flex-grow pl-2 whitespace-pre-wrap overflow-hidden text-ellipsis">
                {lines[virtualItem.index] || " "}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollbar indicator */}
      <div className="px-4 py-2 border-t border-slate-200 bg-slate-100 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Showing lines{" "}
          {virtualItems.length > 0
            ? `${virtualItems[0].index + 1}-${
                virtualItems[virtualItems.length - 1].index + 1
              } of ${lines.length.toLocaleString()}`
            : "0-0 of 0"}
        </span>
        <div className="w-32">
          <Progress
            value={
              parentRef.current && lines.length > 0
                ? (parentRef.current.scrollTop / (totalHeight - parentRef.current.clientHeight)) * 100
                : 0
            }
            className="h-1"
          />
        </div>
      </div>
    </div>
  )
}

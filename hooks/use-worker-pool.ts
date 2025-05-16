"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { getWorkerPool, TaskPriority } from "@/lib/worker-pool"

interface TaskOptions {
  priority?: TaskPriority
  onProgress?: (progress: number, stage?: string) => void
  onComplete?: (result: string) => void
  onError?: (error: string) => void
}

export default function useWorkerPool() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  const activeTasksRef = useRef<Set<string>>(new Set())

  // Initialize worker pool on mount
  useEffect(() => {
    const workerPool = getWorkerPool()
    workerPool.initialize()

    // Cleanup on unmount
    return () => {
      // Cancel all active tasks
      activeTasksRef.current.forEach((taskId) => {
        workerPool.cancelTask(taskId)
      })
      activeTasksRef.current.clear()
    }
  }, [])

  // Parse a text file
  const parseTextFile = useCallback((file: File, options: TaskOptions = {}) => {
    const workerPool = getWorkerPool()
    setIsProcessing(true)
    setProgress(0)
    setStage("Preparing text file")
    setError(null)

    const taskId = workerPool.addDocumentParserTask({
      type: "parseText",
      file,
      priority: options.priority || TaskPriority.NORMAL,
      onProgress: (progress, stage) => {
        setProgress(progress)
        if (stage) setStage(stage)
        options.onProgress?.(progress, stage)
      },
      onComplete: (result) => {
        setIsProcessing(false)
        setProgress(100)
        setStage(undefined)
        activeTasksRef.current.delete(taskId)
        options.onComplete?.(result)
      },
      onError: (err) => {
        setIsProcessing(false)
        setError(err)
        activeTasksRef.current.delete(taskId)
        options.onError?.(err)
      },
    })

    activeTasksRef.current.add(taskId)
    return taskId
  }, [])

  // Parse a PDF file
  const parsePdfFile = useCallback((file: File, options: TaskOptions = {}) => {
    const workerPool = getWorkerPool()
    setIsProcessing(true)
    setProgress(0)
    setStage("Preparing PDF file")
    setError(null)

    const taskId = workerPool.addDocumentParserTask({
      type: "parsePdf",
      file,
      priority: options.priority || TaskPriority.NORMAL,
      onProgress: (progress, stage) => {
        setProgress(progress)
        if (stage) setStage(stage)
        options.onProgress?.(progress, stage)
      },
      onComplete: (result) => {
        setIsProcessing(false)
        setProgress(100)
        setStage(undefined)
        activeTasksRef.current.delete(taskId)
        options.onComplete?.(result)
      },
      onError: (err) => {
        setIsProcessing(false)
        setError(err)
        activeTasksRef.current.delete(taskId)
        options.onError?.(err)
      },
    })

    activeTasksRef.current.add(taskId)
    return taskId
  }, [])

  // Parse a DOCX file
  const parseDocxFile = useCallback((file: File, options: TaskOptions = {}) => {
    const workerPool = getWorkerPool()
    setIsProcessing(true)
    setProgress(0)
    setStage("Preparing DOCX file")
    setError(null)

    const taskId = workerPool.addDocumentParserTask({
      type: "parseDocx",
      file,
      priority: options.priority || TaskPriority.HIGH, // Higher priority for DOCX files
      onProgress: (progress, stage) => {
        setProgress(progress)
        if (stage) setStage(stage)
        options.onProgress?.(progress, stage)
      },
      onComplete: (result) => {
        setIsProcessing(false)
        setProgress(100)
        setStage(undefined)
        activeTasksRef.current.delete(taskId)
        options.onComplete?.(result)
      },
      onError: (err) => {
        setIsProcessing(false)
        setError(err)
        activeTasksRef.current.delete(taskId)
        options.onError?.(err)
      },
    })

    activeTasksRef.current.add(taskId)
    return taskId
  }, [])

  // Process text
  const processText = useCallback((text: string, chunkSize = 50000, options: TaskOptions = {}) => {
    const workerPool = getWorkerPool()
    setIsProcessing(true)
    setProgress(0)
    setStage("Processing text")
    setError(null)

    const taskId = workerPool.addTextProcessorTask({
      type: "processText",
      text,
      chunkSize,
      priority: options.priority || TaskPriority.NORMAL,
      onProgress: (progress, stage) => {
        setProgress(progress)
        if (stage) setStage(stage)
        options.onProgress?.(progress, stage)
      },
      onComplete: (result) => {
        setIsProcessing(false)
        setProgress(100)
        setStage(undefined)
        activeTasksRef.current.delete(taskId)
        options.onComplete?.(result)
      },
      onError: (err) => {
        setIsProcessing(false)
        setError(err)
        activeTasksRef.current.delete(taskId)
        options.onError?.(err)
      },
    })

    activeTasksRef.current.add(taskId)
    return taskId
  }, [])

  // Enhance text
  const enhanceText = useCallback((text: string, enhanceOptions: any = {}, options: TaskOptions = {}) => {
    const workerPool = getWorkerPool()
    setIsProcessing(true)
    setProgress(0)
    setStage("Enhancing text")
    setError(null)

    const taskId = workerPool.addTextProcessorTask({
      type: "enhanceText",
      text,
      enhanceOptions,
      priority: options.priority || TaskPriority.NORMAL,
      onProgress: (progress, stage) => {
        setProgress(progress)
        if (stage) setStage(stage)
        options.onProgress?.(progress, stage)
      },
      onComplete: (result) => {
        setIsProcessing(false)
        setProgress(100)
        setStage(undefined)
        activeTasksRef.current.delete(taskId)
        options.onComplete?.(result)
      },
      onError: (err) => {
        setIsProcessing(false)
        setError(err)
        activeTasksRef.current.delete(taskId)
        options.onError?.(err)
      },
    })

    activeTasksRef.current.add(taskId)
    return taskId
  }, [])

  // Cancel a task
  const cancelTask = useCallback((taskId: string) => {
    const workerPool = getWorkerPool()
    workerPool.cancelTask(taskId)
    activeTasksRef.current.delete(taskId)
    setIsProcessing(false)
  }, [])

  // Get pool status
  const getPoolStatus = useCallback(() => {
    const workerPool = getWorkerPool()
    return workerPool.getStatus()
  }, [])

  return {
    isProcessing,
    progress,
    stage,
    error,
    parseTextFile,
    parsePdfFile,
    parseDocxFile,
    processText,
    enhanceText,
    cancelTask,
    getPoolStatus,
  }
}

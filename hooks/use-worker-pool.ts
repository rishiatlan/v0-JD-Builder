"use client"

import { useState, useEffect, useCallback } from "react"
import { getWorkerPool, TaskPriority, TaskStatus, TaskType } from "@/lib/worker-pool"

interface UseWorkerPoolOptions {
  onComplete?: (result: any) => void
  onError?: (error: string) => void
  onProgress?: (progress: number, stage?: string) => void
  onStatusChange?: (status: TaskStatus) => void
  priority?: TaskPriority
  timeout?: number
}

export function useWorkerPool() {
  const [taskIds, setTaskIds] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stage, setStage] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  // Initialize worker pool
  useEffect(() => {
    const workerPool = getWorkerPool()
    workerPool.initialize()

    // Cleanup function
    return () => {
      // Cancel all tasks created by this hook
      taskIds.forEach((taskId) => {
        workerPool.cancelTask(taskId)
      })
    }
  }, [taskIds])

  // Parse text file
  const parseTextFile = useCallback((file: File, options?: UseWorkerPoolOptions) => {
    setIsProcessing(true)
    setProgress(0)
    setStage(undefined)
    setError(null)

    const workerPool = getWorkerPool()

    // Read file as ArrayBuffer
    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer

      // Add task to worker pool
      const taskId = workerPool.addTask({
        type: TaskType.PARSE_TEXT,
        priority: options?.priority || TaskPriority.NORMAL,
        data: {
          fileData: arrayBuffer,
          fileName: file.name,
          fileType: file.type,
          chunkSize: 50000, // 50KB chunks
        },
        workerType: "document",
        onProgress: (progress, stage) => {
          setProgress(progress)
          if (stage) setStage(stage)
          options?.onProgress?.(progress, stage)
        },
        onComplete: (result) => {
          setIsProcessing(false)
          setProgress(100)
          options?.onComplete?.(result)
        },
        onError: (error) => {
          setIsProcessing(false)
          setError(error)
          options?.onError?.(error)
        },
        onStatusChange: (status) => {
          if (status === TaskStatus.RUNNING) {
            setIsProcessing(true)
          } else if (
            status === TaskStatus.COMPLETED ||
            status === TaskStatus.FAILED ||
            status === TaskStatus.CANCELLED
          ) {
            setIsProcessing(false)
          }
          options?.onStatusChange?.(status)
        },
        timeoutMs: options?.timeout || 5 * 60 * 1000, // Default 5 minutes
      })

      // Add task ID to list
      setTaskIds((prev) => [...prev, taskId])
    }

    reader.onerror = () => {
      setIsProcessing(false)
      const error = "Failed to read file"
      setError(error)
      options?.onError?.(error)
    }

    reader.readAsArrayBuffer(file)
  }, [])

  // Parse PDF file
  const parsePdfFile = useCallback((file: File, options?: UseWorkerPoolOptions) => {
    setIsProcessing(true)
    setProgress(0)
    setStage(undefined)
    setError(null)

    const workerPool = getWorkerPool()

    // Read file as ArrayBuffer
    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer

      // Add task to worker pool
      const taskId = workerPool.addTask({
        type: TaskType.PARSE_PDF,
        priority: options?.priority || TaskPriority.NORMAL,
        data: {
          fileData: arrayBuffer,
        },
        workerType: "document",
        onProgress: (progress, stage) => {
          setProgress(progress)
          if (stage) setStage(stage)
          options?.onProgress?.(progress, stage)
        },
        onComplete: (result) => {
          setIsProcessing(false)
          setProgress(100)
          options?.onComplete?.(result)
        },
        onError: (error) => {
          setIsProcessing(false)
          setError(error)
          options?.onError?.(error)
        },
        onStatusChange: (status) => {
          if (status === TaskStatus.RUNNING) {
            setIsProcessing(true)
          } else if (
            status === TaskStatus.COMPLETED ||
            status === TaskStatus.FAILED ||
            status === TaskStatus.CANCELLED
          ) {
            setIsProcessing(false)
          }
          options?.onStatusChange?.(status)
        },
        timeoutMs: options?.timeout || 5 * 60 * 1000, // Default 5 minutes
      })

      // Add task ID to list
      setTaskIds((prev) => [...prev, taskId])
    }

    reader.onerror = () => {
      setIsProcessing(false)
      const error = "Failed to read file"
      setError(error)
      options?.onError?.(error)
    }

    reader.readAsArrayBuffer(file)
  }, [])

  // Process text
  const processText = useCallback((text: string, chunkSize = 50000, options?: UseWorkerPoolOptions) => {
    setIsProcessing(true)
    setProgress(0)
    setStage(undefined)
    setError(null)

    const workerPool = getWorkerPool()

    // Add task to worker pool
    const taskId = workerPool.addTask({
      type: TaskType.PROCESS_TEXT,
      priority: options?.priority || TaskPriority.NORMAL,
      data: {
        text,
        chunkSize,
      },
      workerType: "text",
      onProgress: (progress, stage) => {
        setProgress(progress)
        if (stage) setStage(stage)
        options?.onProgress?.(progress, stage)
      },
      onComplete: (result) => {
        setIsProcessing(false)
        setProgress(100)
        options?.onComplete?.(result)
      },
      onError: (error) => {
        setIsProcessing(false)
        setError(error)
        options?.onError?.(error)
      },
      onStatusChange: (status) => {
        if (status === TaskStatus.RUNNING) {
          setIsProcessing(true)
        } else if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED || status === TaskStatus.CANCELLED) {
          setIsProcessing(false)
        }
        options?.onStatusChange?.(status)
      },
      timeoutMs: options?.timeout || 5 * 60 * 1000, // Default 5 minutes
    })

    // Add task ID to list
    setTaskIds((prev) => [...prev, taskId])
  }, [])

  // Enhance text
  const enhanceText = useCallback((text: string, enhanceOptions = {}, options?: UseWorkerPoolOptions) => {
    setIsProcessing(true)
    setProgress(0)
    setStage(undefined)
    setError(null)

    const workerPool = getWorkerPool()

    // Add task to worker pool
    const taskId = workerPool.addTask({
      type: TaskType.ENHANCE_TEXT,
      priority: options?.priority || TaskPriority.NORMAL,
      data: {
        text,
        options: enhanceOptions,
      },
      workerType: "text",
      onProgress: (progress, stage) => {
        setProgress(progress)
        if (stage) setStage(stage)
        options?.onProgress?.(progress, stage)
      },
      onComplete: (result) => {
        setIsProcessing(false)
        setProgress(100)
        options?.onComplete?.(result)
      },
      onError: (error) => {
        setIsProcessing(false)
        setError(error)
        options?.onError?.(error)
      },
      onStatusChange: (status) => {
        if (status === TaskStatus.RUNNING) {
          setIsProcessing(true)
        } else if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED || status === TaskStatus.CANCELLED) {
          setIsProcessing(false)
        }
        options?.onStatusChange?.(status)
      },
      timeoutMs: options?.timeout || 5 * 60 * 1000, // Default 5 minutes
    })

    // Add task ID to list
    setTaskIds((prev) => [...prev, taskId])
  }, [])

  // Cancel all tasks
  const cancelAllTasks = useCallback(() => {
    const workerPool = getWorkerPool()

    // Cancel all tasks created by this hook
    taskIds.forEach((taskId) => {
      workerPool.cancelTask(taskId)
    })

    // Reset state
    setIsProcessing(false)
    setProgress(0)
    setStage(undefined)
    setTaskIds([])
  }, [taskIds])

  // Get pool status
  const getPoolStatus = useCallback(() => {
    const workerPool = getWorkerPool()
    return workerPool.getPoolStatus()
  }, [])

  return {
    parseTextFile,
    parsePdfFile,
    processText,
    enhanceText,
    cancelAllTasks,
    getPoolStatus,
    isProcessing,
    progress,
    stage,
    error,
  }
}

export default useWorkerPool

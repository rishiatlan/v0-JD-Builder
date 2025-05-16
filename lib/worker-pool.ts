// Enhanced Worker Pool Manager
// Manages a pool of workers for efficient concurrent task processing with improved reliability

import { logMemoryUsage } from "./memory-optimization"
import { circuitBreakerRegistry } from "./circuit-breaker"
import {
  isWorkerSupported,
  createDocumentParserWorker,
  createTextProcessorWorker,
  parseTextWithWorker,
  parsePdfWithWorker,
  parseDocxWithWorker,
  processTextWithWorker,
  enhanceTextWithWorker,
  cancelWorkerOperation,
  terminateWorker,
  TaskType, // Declare TaskType here
} from "@/lib/worker-manager"

// Define task priority levels
export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3,
}

// Define task status
export enum TaskStatus {
  QUEUED = "queued",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  TIMEOUT = "timeout",
}

// Define task types
export type DocumentParserTaskType = "parseText" | "parsePdf" | "parseDocx"
export type TextProcessorTaskType = "processText" | "enhanceText"

// Task interfaces
export interface DocumentParserTask {
  id: string
  type: DocumentParserTaskType
  file: File
  priority: TaskPriority
  onProgress?: (progress: number, stage?: string) => void
  onComplete?: (result: string) => void
  onError?: (error: string) => void
}

export interface TextProcessorTask {
  id: string
  type: TextProcessorTaskType
  text: string
  chunkSize?: number
  enhanceOptions?: any
  priority: TaskPriority
  onProgress?: (progress: number, stage?: string) => void
  onComplete?: (result: string) => void
  onError?: (error: string) => void
}

export type WorkerTask = DocumentParserTask | TextProcessorTask

// Worker types
type DocumentParserWorker = {
  worker: Worker
  busy: boolean
  currentTaskId: string | null
}

type TextProcessorWorker = {
  worker: Worker
  busy: boolean
  currentTaskId: string | null
}

// Worker pool configuration
interface WorkerPoolConfig {
  maxDocumentWorkers: number
  maxTextWorkers: number
  taskTimeout?: number // Default timeout in ms
  workerTimeout?: number // Time in ms after which an idle worker is terminated
  maxErrorsPerWorker?: number // Max errors before worker is recreated
  // Enhanced properties
  maxRetries?: number // Default max retries for tasks
  retryDelay?: number // Default retry delay in ms
  persistResults?: boolean // Whether to persist results by default
  useCircuitBreaker?: boolean // Whether to use circuit breaker pattern
  adaptiveWorkers?: boolean // Whether to adaptively scale workers based on load
  maxConcurrentTasks?: number // Maximum number of tasks to process concurrently
  priorityBoost?: boolean // Whether to boost priority of waiting tasks over time
  fairnessEnabled?: boolean // Whether to ensure fairness in task processing
  performanceTracking?: boolean // Whether to track worker performance
  loadBalancingStrategy?: "round-robin" | "least-busy" | "performance-based" // Load balancing strategy
  maintenanceInterval?: number // Interval for maintenance in ms
  maxQueueSize?: number // Maximum size of the task queue
  maxTasksPerWorker?: number // Maximum number of tasks a worker can process before being recreated
}

// Default configuration
const DEFAULT_CONFIG: WorkerPoolConfig = {
  maxDocumentWorkers: 2,
  maxTextWorkers: 2,
  taskTimeout: 5 * 60 * 1000, // 5 minutes
  workerTimeout: 3 * 60 * 1000, // 3 minutes
  maxErrorsPerWorker: 3,
  // Enhanced defaults
  maxRetries: 2,
  retryDelay: 1000, // 1 second
  persistResults: true,
  useCircuitBreaker: true,
  adaptiveWorkers: true,
  maxConcurrentTasks: 4,
  priorityBoost: true,
  fairnessEnabled: true,
  performanceTracking: true,
  loadBalancingStrategy: "performance-based",
  maintenanceInterval: 30000, // 30 seconds
  maxQueueSize: 100,
  maxTasksPerWorker: 50,
}

// Pool metrics
interface PoolMetrics {
  totalTasksProcessed: number
  successfulTasks: number
  failedTasks: number
  cancelledTasks: number
  timeoutTasks: number
  averageQueueTime: number
  averageProcessingTime: number
  currentQueueLength: number
  currentRunningTasks: number
  peakConcurrentTasks: number
  workerUtilization: number
  taskTypeBreakdown: Record<string, number>
  errorRate: number
  throughput: number // Tasks per minute
}

class WorkerPool {
  private documentWorkers: DocumentParserWorker[] = []
  private textWorkers: TextProcessorWorker[] = []
  private documentTasks: DocumentParserTask[] = []
  private textTasks: TextProcessorTask[] = []
  private taskCounter = 0
  private config: WorkerPoolConfig
  private initialized = false
  private maintenanceInterval: NodeJS.Timeout | null = null
  private adaptiveScalingInterval: NodeJS.Timeout | null = null
  private priorityBoostInterval: NodeJS.Timeout | null = null
  private lastAdaptiveCheck = 0
  private lastThroughputCheck = Date.now()
  private tasksCompletedSinceLastCheck = 0
  private circuitBreaker = circuitBreakerRegistry.getBreaker("worker-pool")
  private taskHistory: Map<string, { success: boolean; duration: number }[]> = new Map()
  private fairnessTracker: Map<string, number> = new Map()
  private metrics: PoolMetrics = {
    totalTasksProcessed: 0,
    successfulTasks: 0,
    failedTasks: 0,
    cancelledTasks: 0,
    timeoutTasks: 0,
    averageQueueTime: 0,
    averageProcessingTime: 0,
    currentQueueLength: 0,
    currentRunningTasks: 0,
    peakConcurrentTasks: 0,
    workerUtilization: 0,
    taskTypeBreakdown: {},
    errorRate: 0,
    throughput: 0,
  }

  constructor(config: WorkerPoolConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // Initialize the worker pool
  public initialize(): void {
    if (this.initialized || !isWorkerSupported) return

    // Create document parser workers
    for (let i = 0; i < this.config.maxDocumentWorkers; i++) {
      const worker = createDocumentParserWorker()
      if (worker) {
        this.documentWorkers.push({
          worker,
          busy: false,
          currentTaskId: null,
        })
      }
    }

    // Create text processor workers
    for (let i = 0; i < this.config.maxTextWorkers; i++) {
      const worker = createTextProcessorWorker()
      if (worker) {
        this.textWorkers.push({
          worker,
          busy: false,
          currentTaskId: null,
        })
      }
    }

    // Initialize fairness tracker
    Object.values(TaskType).forEach((type) => {
      this.fairnessTracker.set(type, 0)
    })

    // Start maintenance interval
    this.maintenanceInterval = setInterval(
      () => this.performMaintenance(),
      this.config.maintenanceInterval || DEFAULT_CONFIG.maintenanceInterval!,
    )

    // Start adaptive scaling if enabled
    if (this.config.adaptiveWorkers) {
      this.adaptiveScalingInterval = setInterval(() => this.adaptWorkerPool(), 5000)
    }

    // Start priority boost interval if enabled
    if (this.config.priorityBoost) {
      this.priorityBoostInterval = setInterval(() => this.boostTaskPriorities(), 10000)
    }

    this.initialized = true
    console.log(
      `Worker pool initialized with ${this.documentWorkers.length} document workers and ${this.textWorkers.length} text workers`,
    )
  }

  // Add a document parser task
  public addDocumentParserTask(task: Omit<DocumentParserTask, "id">): string {
    const id = `doc_${++this.taskCounter}`
    const fullTask: DocumentParserTask = { ...task, id }

    // Add to task queue
    this.documentTasks.push(fullTask)

    // Sort tasks by priority
    this.documentTasks.sort((a, b) => b.priority - a.priority)

    // Try to process tasks
    this.processDocumentTasks()

    return id
  }

  // Add a text processor task
  public addTextProcessorTask(task: Omit<TextProcessorTask, "id">): string {
    const id = `text_${++this.taskCounter}`
    const fullTask: TextProcessorTask = { ...task, id }

    // Add to task queue
    this.textTasks.push(fullTask)

    // Sort tasks by priority
    this.textTasks.sort((a, b) => b.priority - a.priority)

    // Try to process tasks
    this.processTextTasks()

    return id
  }

  // Process document tasks
  private processDocumentTasks(): void {
    if (this.documentTasks.length === 0) return

    // Find available workers
    const availableWorker = this.documentWorkers.find((w) => !w.busy)
    if (!availableWorker) return

    // Get next task
    const task = this.documentTasks.shift()
    if (!task) return

    // Mark worker as busy
    availableWorker.busy = true
    availableWorker.currentTaskId = task.id

    // Process task based on type
    this.processDocumentTask(availableWorker, task)
  }

  // Process text tasks
  private processTextTasks(): void {
    if (this.textTasks.length === 0) return

    // Find available workers
    const availableWorker = this.textWorkers.find((w) => !w.busy)
    if (!availableWorker) return

    // Get next task
    const task = this.textTasks.shift()
    if (!task) return

    // Mark worker as busy
    availableWorker.busy = true
    availableWorker.currentTaskId = task.id

    // Process task based on type
    this.processTextTask(availableWorker, task)
  }

  // Process a document task
  private processDocumentTask(workerObj: DocumentParserWorker, task: DocumentParserTask): void {
    const { worker } = workerObj
    const { type, file, onProgress, onComplete, onError } = task

    const handleTaskComplete = (result: string) => {
      // Mark worker as available
      workerObj.busy = false
      workerObj.currentTaskId = null

      // Call completion callback
      if (onComplete) onComplete(result)

      // Process next task
      this.processDocumentTasks()
    }

    const handleTaskError = (error: string) => {
      // Mark worker as available
      workerObj.busy = false
      workerObj.currentTaskId = null

      // Call error callback
      if (onError) onError(error)

      // Process next task
      this.processDocumentTasks()
    }

    try {
      // Process based on task type
      switch (type) {
        case "parseText":
          parseTextWithWorker(worker, file, 50000, onProgress, onError)
            .then(handleTaskComplete)
            .catch((error) => handleTaskError(error.message))
          break

        case "parsePdf":
          parsePdfWithWorker(worker, file, onProgress, onError)
            .then(handleTaskComplete)
            .catch((error) => handleTaskError(error.message))
          break

        case "parseDocx":
          parseDocxWithWorker(worker, file, onProgress, onError)
            .then(handleTaskComplete)
            .catch((error) => handleTaskError(error.message))
          break

        default:
          handleTaskError(`Unknown task type: ${type}`)
      }
    } catch (error) {
      handleTaskError(`Task execution error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Process a text task
  private processTextTask(workerObj: TextProcessorWorker, task: TextProcessorTask): void {
    const { worker } = workerObj
    const { type, text, chunkSize, enhanceOptions, onProgress, onComplete, onError } = task

    const handleTaskComplete = (result: string) => {
      // Mark worker as available
      workerObj.busy = false
      workerObj.currentTaskId = null

      // Call completion callback
      if (onComplete) onComplete(result)

      // Process next task
      this.processTextTasks()
    }

    const handleTaskError = (error: string) => {
      // Mark worker as available
      workerObj.busy = false
      workerObj.currentTaskId = null

      // Call error callback
      if (onError) onError(error)

      // Process next task
      this.processTextTasks()
    }

    try {
      // Process based on task type
      switch (type) {
        case "processText":
          processTextWithWorker(worker, text, chunkSize || 50000, onProgress, onError)
            .then(handleTaskComplete)
            .catch((error) => handleTaskError(error.message))
          break

        case "enhanceText":
          enhanceTextWithWorker(worker, text, enhanceOptions, onProgress, onError)
            .then(handleTaskComplete)
            .catch((error) => handleTaskError(error.message))
          break

        default:
          handleTaskError(`Unknown task type: ${type}`)
      }
    } catch (error) {
      handleTaskError(`Task execution error: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Cancel a task
  public cancelTask(taskId: string): boolean {
    // Check document tasks queue
    const docTaskIndex = this.documentTasks.findIndex((task) => task.id === taskId)
    if (docTaskIndex !== -1) {
      this.documentTasks.splice(docTaskIndex, 1)
      return true
    }

    // Check text tasks queue
    const textTaskIndex = this.textTasks.findIndex((task) => task.id === taskId)
    if (textTaskIndex !== -1) {
      this.textTasks.splice(textTaskIndex, 1)
      return true
    }

    // Check if task is currently being processed by a document worker
    const docWorker = this.documentWorkers.find((w) => w.currentTaskId === taskId)
    if (docWorker) {
      cancelWorkerOperation(docWorker.worker)
      docWorker.busy = false
      docWorker.currentTaskId = null
      this.processDocumentTasks() // Process next task
      return true
    }

    // Check if task is currently being processed by a text worker
    const textWorker = this.textWorkers.find((w) => w.currentTaskId === taskId)
    if (textWorker) {
      cancelWorkerOperation(textWorker.worker)
      textWorker.busy = false
      textWorker.currentTaskId = null
      this.processTextTasks() // Process next task
      return true
    }

    return false // Task not found
  }

  // Get pool status
  public getStatus() {
    return {
      workers: {
        document: {
          total: this.documentWorkers.length,
          busy: this.documentWorkers.filter((w) => w.busy).length,
        },
        text: {
          total: this.textWorkers.length,
          busy: this.textWorkers.filter((w) => w.busy).length,
        },
      },
      tasks: {
        queued: this.documentTasks.length + this.textTasks.length,
        running: this.documentWorkers.filter((w) => w.busy).length + this.textWorkers.filter((w) => w.busy).length,
      },
    }
  }

  // Clean up resources
  public cleanup(): void {
    // Terminate all workers
    this.documentWorkers.forEach((w) => terminateWorker(w.worker))
    this.textWorkers.forEach((w) => terminateWorker(w.worker))

    // Clear arrays
    this.documentWorkers = []
    this.textWorkers = []
    this.documentTasks = []
    this.textTasks = []

    this.initialized = false
  }

  /**
   * Adaptively scale the worker pool based on load
   */
  private adaptWorkerPool(): void {
    if (!this.config.adaptiveWorkers) return

    const now = Date.now()

    // Only check every 10 seconds
    if (now - this.lastAdaptiveCheck < 10000) return
    this.lastAdaptiveCheck = now

    const queueLength = this.documentTasks.length + this.textTasks.length
    const runningTasksCount =
      this.documentWorkers.filter((w) => w.busy).length + this.textWorkers.filter((w) => w.busy).length
    const documentWorkers = this.documentWorkers.length
    const textWorkers = this.textWorkers.length

    console.log(
      `Adaptive scaling check - Queue: ${queueLength}, Running: ${runningTasksCount}, Workers: ${documentWorkers} doc, ${textWorkers} text`,
    )

    // Calculate worker utilization
    const totalWorkers = documentWorkers + textWorkers
    this.metrics.workerUtilization = totalWorkers > 0 ? runningTasksCount / totalWorkers : 0

    // Scale up if we have a backlog or high utilization
    if (queueLength > 0 || this.metrics.workerUtilization > 0.7) {
      // Scale document workers if needed
      if (this.documentTasks.length > 0 && documentWorkers < this.config.maxDocumentWorkers) {
        console.log("Scaling up document workers")
        const worker = createDocumentParserWorker()
        if (worker) {
          this.documentWorkers.push({
            worker,
            busy: false,
            currentTaskId: null,
          })
        }
      }

      // Scale text workers if needed
      if (this.textTasks.length > 0 && textWorkers < this.config.maxTextWorkers) {
        console.log("Scaling up text workers")
        const worker = createTextProcessorWorker()
        if (worker) {
          this.textWorkers.push({
            worker,
            busy: false,
            currentTaskId: null,
          })
        }
      }
    }

    // Scale down if we have excess capacity and no backlog
    if (queueLength === 0 && this.metrics.workerUtilization < 0.3) {
      // Find idle workers that can be terminated
      const idleDocumentWorkers = this.documentWorkers.filter((w) => !w.busy)
      const idleTextWorkers = this.textWorkers.filter((w) => !w.busy)

      // Terminate excess idle document workers
      for (let i = idleDocumentWorkers.length - 1; i >= 0; i--) {
        if (this.documentWorkers.length > 1) {
          console.log(
            `Scaling down document workers (${this.documentWorkers.length} -> ${this.documentWorkers.length - 1})`,
          )
          terminateWorker(idleDocumentWorkers[i].worker)
          this.documentWorkers.splice(i, 1)
        }
      }

      // Terminate excess idle text workers
      for (let i = idleTextWorkers.length - 1; i >= 0; i--) {
        if (this.textWorkers.length > 1) {
          console.log(`Scaling down text workers (${this.textWorkers.length} -> ${this.textWorkers.length - 1})`)
          terminateWorker(idleTextWorkers[i].worker)
          this.textWorkers.splice(i, 1)
        }
      }
    }

    // Update metrics
    this.metrics.currentQueueLength = queueLength
    this.metrics.currentRunningTasks = runningTasksCount
    this.metrics.peakConcurrentTasks = Math.max(this.metrics.peakConcurrentTasks, runningTasksCount)
  }

  /**
   * Boost priority of waiting tasks to ensure fairness
   */
  private boostTaskPriorities(): void {
    if (!this.config.priorityBoost) return

    const now = Date.now()

    // Boost priority of document tasks that have been waiting too long
    for (const task of this.documentTasks) {
      const waitTime = now - Number.parseInt(task.id.split("_")[1]) // Extract timestamp from id

      // If a task has been waiting for more than 30 seconds, boost its priority
      if (waitTime > 30000 && task.priority > TaskPriority.HIGH) {
        task.priority -= 1 // Increase priority (lower number = higher priority)
        console.log(
          `Boosting priority of document task ${task.id} (${task.type}) after waiting ${Math.round(waitTime / 1000)}s`,
        )
      }
    }

    // Boost priority of text tasks that have been waiting too long
    for (const task of this.textTasks) {
      const waitTime = now - Number.parseInt(task.id.split("_")[1]) // Extract timestamp from id

      // If a task has been waiting for more than 30 seconds, boost its priority
      if (waitTime > 30000 && task.priority > TaskPriority.HIGH) {
        task.priority -= 1 // Increase priority (lower number = higher priority)
        console.log(
          `Boosting priority of text task ${task.id} (${task.type}) after waiting ${Math.round(waitTime / 1000)}s`,
        )
      }
    }

    // Re-sort the queues by priority
    this.documentTasks.sort((a, b) => b.priority - a.priority)
    this.textTasks.sort((a, b) => b.priority - a.priority)
  }

  /**
   * Perform maintenance on the worker pool
   */
  private performMaintenance(): void {
    const now = Date.now()
    const workerTimeout = this.config.workerTimeout || DEFAULT_CONFIG.workerTimeout!

    // Check for idle workers to terminate
    for (const workerObj of this.documentWorkers) {
      // Skip busy workers
      if (workerObj.busy) continue

      // Check if worker has been idle for too long
      if (now - workerObj.worker.lastActiveAt > workerTimeout) {
        console.log(`Terminating idle document worker ${workerObj.worker.id}`)
        terminateWorker(workerObj.worker)
        this.documentWorkers = this.documentWorkers.filter((w) => w.worker.id !== workerObj.worker.id)
      }
    }

    for (const workerObj of this.textWorkers) {
      // Skip busy workers
      if (workerObj.busy) continue

      // Check if worker has been idle for too long
      if (now - workerObj.worker.lastActiveAt > workerTimeout) {
        console.log(`Terminating idle text worker ${workerObj.worker.id}`)
        terminateWorker(workerObj.worker)
        this.textWorkers = this.textWorkers.filter((w) => w.worker.id !== workerObj.worker.id)
      }
    }

    // Calculate throughput
    const timeSinceLastCheck = now - this.lastThroughputCheck
    if (timeSinceLastCheck >= 60000) {
      // 1 minute
      this.metrics.throughput = (this.tasksCompletedSinceLastCheck / timeSinceLastCheck) * 60000
      this.tasksCompletedSinceLastCheck = 0
      this.lastThroughputCheck = now
    }

    // Log pool status
    logMemoryUsage("Worker pool maintenance")
    console.log("Worker pool status:", this.getStatus())
  }
}

// Create singleton instance
let workerPoolInstance: WorkerPool | null = null

// Get worker pool instance
export function getWorkerPool(config?: WorkerPoolConfig): WorkerPool {
  if (!workerPoolInstance) {
    workerPoolInstance = new WorkerPool(config)
  }
  return workerPoolInstance
}

// Clean up worker pool
export function cleanupWorkerPool(): void {
  if (workerPoolInstance) {
    workerPoolInstance.cleanup()
    workerPoolInstance = null
  }
}

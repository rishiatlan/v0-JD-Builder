// Enhanced Worker Pool Manager
// Manages a pool of workers for efficient concurrent task processing with improved reliability

import { logMemoryUsage } from "./memory-optimization"
import { circuitBreakerRegistry } from "./circuit-breaker"
import { storageService } from "./indexed-db"

// Define task priority levels
export enum TaskPriority {
  HIGH = 0,
  NORMAL = 1,
  LOW = 2,
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
export enum TaskType {
  PARSE_TEXT = "parseText",
  PARSE_PDF = "parsePdf",
  PARSE_DOCX = "parseDocx",
  PROCESS_TEXT = "processText",
  ENHANCE_TEXT = "enhanceText",
  ANALYZE_DOCUMENT = "analyzeDocument",
  GENERATE_JD = "generateJD",
}

// Task interface
export interface Task {
  id: string
  type: TaskType
  priority: TaskPriority
  data: any
  status: TaskStatus
  progress: number
  result?: any
  error?: string
  createdAt: number
  startedAt?: number
  completedAt?: number
  onProgress?: (progress: number, stage?: string) => void
  onComplete?: (result: any) => void
  onError?: (error: string) => void
  onStatusChange?: (status: TaskStatus) => void
  timeoutMs?: number
  timeoutId?: NodeJS.Timeout
  workerType: "document" | "text"
  // Enhanced properties
  retryCount?: number
  maxRetries?: number
  retryDelay?: number
  persistResult?: boolean // Whether to persist the result to storage
  storageKey?: string // Key to use for storage
  estimatedDuration?: number // Estimated duration in ms
  weight?: number // Computational weight (1-10)
  tags?: string[] // Tags for categorization
  metadata?: Record<string, any> // Additional metadata
}

// Worker interface
interface PoolWorker {
  id: string
  worker: Worker
  type: "document" | "text"
  busy: boolean
  currentTask?: string // Task ID
  taskCount: number
  createdAt: number
  lastActiveAt: number
  errors: number
  // Enhanced properties
  performance: number // Performance score (1-10)
  successRate: number // Success rate (0-1)
  averageTaskDuration: number // Average task duration in ms
  totalTaskTime: number // Total time spent on tasks in ms
  memoryUsage?: number // Memory usage if available
  lastErrorTime?: number // Time of last error
}

// Configuration for the worker pool
interface WorkerPoolConfig {
  maxDocumentWorkers?: number
  maxTextWorkers?: number
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
  taskTypeBreakdown: Record<TaskType, number>
  errorRate: number
  throughput: number // Tasks per minute
}

class WorkerPool {
  private workers: Map<string, PoolWorker> = new Map()
  private taskQueue: Task[] = []
  private runningTasks: Map<string, Task> = new Map()
  private config: WorkerPoolConfig
  private isInitialized = false
  private maintenanceInterval: NodeJS.Timeout | null = null
  private isWorkerSupported: boolean
  // Enhanced properties
  private circuitBreaker = circuitBreakerRegistry.getBreaker("worker-pool")
  private taskHistory: Map<string, { success: boolean; duration: number }[]> = new Map()
  private adaptiveScalingInterval: NodeJS.Timeout | null = null
  private lastAdaptiveCheck = 0
  private processingPower = 1 // Relative processing power factor
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
    taskTypeBreakdown: {
      [TaskType.PARSE_TEXT]: 0,
      [TaskType.PARSE_PDF]: 0,
      [TaskType.PARSE_DOCX]: 0,
      [TaskType.PROCESS_TEXT]: 0,
      [TaskType.ENHANCE_TEXT]: 0,
      [TaskType.ANALYZE_DOCUMENT]: 0,
      [TaskType.GENERATE_JD]: 0,
    },
    errorRate: 0,
    throughput: 0,
  }
  private taskStartTimes: Map<string, number> = new Map()
  private lastThroughputCheck = Date.now()
  private tasksCompletedSinceLastCheck = 0
  private priorityBoostInterval: NodeJS.Timeout | null = null
  private fairnessTracker: Map<TaskType, number> = new Map()

  constructor(config: WorkerPoolConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.isWorkerSupported = typeof Worker !== "undefined"

    // Initialize fairness tracker
    Object.values(TaskType).forEach((type) => {
      this.fairnessTracker.set(type, 0)
    })
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

    const queueLength = this.taskQueue.length
    const runningTasksCount = this.runningTasks.size
    const documentWorkers = Array.from(this.workers.values()).filter((w) => w.type === "document").length
    const textWorkers = Array.from(this.workers.values()).filter((w) => w.type === "text").length

    // Calculate how many document vs text tasks are in the queue
    const documentTasks = this.taskQueue.filter((t) => t.workerType === "document").length
    const textTasks = this.taskQueue.filter((t) => t.workerType === "text").length

    console.log(
      `Adaptive scaling check - Queue: ${queueLength} (${documentTasks} doc, ${textTasks} text), Running: ${runningTasksCount}, Workers: ${documentWorkers} doc, ${textWorkers} text`,
    )

    // Calculate worker utilization
    const totalWorkers = documentWorkers + textWorkers
    this.metrics.workerUtilization = totalWorkers > 0 ? runningTasksCount / totalWorkers : 0

    // Scale up if we have a backlog or high utilization
    if (queueLength > 0 || this.metrics.workerUtilization > 0.7) {
      // Scale document workers if needed
      if (
        documentTasks > 0 &&
        documentWorkers < (this.config.maxDocumentWorkers || DEFAULT_CONFIG.maxDocumentWorkers!)
      ) {
        console.log("Scaling up document workers")
        this.createWorker("document")
      }

      // Scale text workers if needed
      if (textTasks > 0 && textWorkers < (this.config.maxTextWorkers || DEFAULT_CONFIG.maxTextWorkers!)) {
        console.log("Scaling up text workers")
        this.createWorker("text")
      }
    }

    // Scale down if we have excess capacity and no backlog
    if (queueLength === 0 && this.metrics.workerUtilization < 0.3) {
      // Find idle workers that can be terminated
      const idleWorkers = Array.from(this.workers.values())
        .filter((w) => !w.busy)
        .sort((a, b) => {
          // Terminate workers with lower performance first
          if (this.config.performanceTracking) {
            return a.performance - b.performance
          }
          // Otherwise terminate oldest idle workers first
          return a.lastActiveAt - b.lastActiveAt
        })

      // Keep at least one worker of each type
      const minDocWorkers = 1
      const minTextWorkers = 1

      // Terminate excess idle workers
      for (const worker of idleWorkers) {
        const currentTypeCount = Array.from(this.workers.values()).filter((w) => w.type === worker.type).length
        const minCount = worker.type === "document" ? minDocWorkers : minTextWorkers

        if (currentTypeCount > minCount) {
          console.log(`Scaling down ${worker.type} workers (${currentTypeCount} -> ${currentTypeCount - 1})`)
          worker.worker.terminate()
          this.workers.delete(worker.id)
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

    // Boost priority of tasks that have been waiting too long
    for (const task of this.taskQueue) {
      const waitTime = now - task.createdAt

      // If a task has been waiting for more than 30 seconds, boost its priority
      if (waitTime > 30000 && task.priority > TaskPriority.HIGH) {
        task.priority -= 1 // Increase priority (lower number = higher priority)
        console.log(`Boosting priority of task ${task.id} (${task.type}) after waiting ${Math.round(waitTime / 1000)}s`)
      }
    }

    // Re-sort the queue by priority
    this.taskQueue.sort((a, b) => {
      // First sort by priority
      if (a.priority !== b.priority) {
        return a.priority - b.priority
      }

      // Then by creation time (older first)
      return a.createdAt - b.createdAt
    })
  }

  /**
   * Initialize the worker pool
   */
  public initialize(): void {
    if (this.isInitialized || !this.isWorkerSupported) return

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

    this.isInitialized = true

    console.log("Worker pool initialized with config:", this.config)
  }

  /**
   * Shutdown the worker pool
   */
  public shutdown(): void {
    if (!this.isInitialized) return

    // Clear maintenance interval
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval)
      this.maintenanceInterval = null
    }

    // Clear adaptive scaling interval
    if (this.adaptiveScalingInterval) {
      clearInterval(this.adaptiveScalingInterval)
      this.adaptiveScalingInterval = null
    }

    // Clear priority boost interval
    if (this.priorityBoostInterval) {
      clearInterval(this.priorityBoostInterval)
      this.priorityBoostInterval = null
    }

    // Cancel all queued tasks
    this.taskQueue.forEach((task) => {
      this.updateTaskStatus(task, TaskStatus.CANCELLED)
      if (task.timeoutId) clearTimeout(task.timeoutId)
    })
    this.taskQueue = []

    // Cancel all running tasks
    this.runningTasks.forEach((task) => {
      this.updateTaskStatus(task, TaskStatus.CANCELLED)
      if (task.timeoutId) clearTimeout(task.timeoutId)
    })
    this.runningTasks.clear()

    // Terminate all workers
    this.workers.forEach((worker) => {
      worker.worker.terminate()
    })
    this.workers.clear()

    this.isInitialized = false
    console.log("Worker pool shut down")
  }

  /**
   * Add a task to the pool
   */
  public addTask(task: Omit<Task, "id" | "status" | "progress" | "createdAt">): string {
    if (!this.isWorkerSupported) {
      if (task.onError) task.onError("Web Workers are not supported in this browser")
      return ""
    }

    if (!this.isInitialized) this.initialize()

    // Check if queue is full
    if (this.taskQueue.length >= (this.config.maxQueueSize || DEFAULT_CONFIG.maxQueueSize!)) {
      const error = "Task queue is full. Please try again later."
      if (task.onError) task.onError(error)
      return ""
    }

    const id = this.generateTaskId()
    const newTask: Task = {
      ...task,
      id,
      status: TaskStatus.QUEUED,
      progress: 0,
      createdAt: Date.now(),
      retryCount: 0,
      maxRetries: task.maxRetries || this.config.maxRetries,
      retryDelay: task.retryDelay || this.config.retryDelay,
      persistResult: task.persistResult !== undefined ? task.persistResult : this.config.persistResults,
    }

    // Set up task timeout if specified
    if (task.timeoutMs) {
      newTask.timeoutId = setTimeout(() => {
        this.handleTaskTimeout(id)
      }, task.timeoutMs)
    }

    // Add task to queue
    this.taskQueue.push(newTask)

    // Update metrics
    this.metrics.currentQueueLength = this.taskQueue.length

    // Update fairness tracker
    this.fairnessTracker.set(newTask.type, (this.fairnessTracker.get(newTask.type) || 0) + 1)

    // Sort queue by priority and fairness if enabled
    if (this.config.fairnessEnabled) {
      this.taskQueue.sort((a, b) => {
        // First sort by priority
        if (a.priority !== b.priority) {
          return a.priority - b.priority
        }

        // Then by fairness (task types with fewer processed tasks get priority)
        const aFairness = this.fairnessTracker.get(a.type) || 0
        const bFairness = this.fairnessTracker.get(b.type) || 0
        if (aFairness !== bFairness) {
          return aFairness - bFairness
        }

        // Finally by creation time
        return a.createdAt - b.createdAt
      })
    } else {
      // Sort queue by priority only
      this.taskQueue.sort((a, b) => a.priority - b.priority)
    }

    // Try to process next task
    this.processNextTask()

    return id
  }

  /**
   * Cancel a task
   */
  public cancelTask(taskId: string): boolean {
    // Check if task is in queue
    const queueIndex = this.taskQueue.findIndex((task) => task.id === taskId)
    if (queueIndex >= 0) {
      const task = this.taskQueue[queueIndex]
      this.updateTaskStatus(task, TaskStatus.CANCELLED)
      if (task.timeoutId) clearTimeout(task.timeoutId)
      this.taskQueue.splice(queueIndex, 1)

      // Update metrics
      this.metrics.cancelledTasks++
      this.metrics.currentQueueLength = this.taskQueue.length

      return true
    }

    // Check if task is running
    if (this.runningTasks.has(taskId)) {
      const task = this.runningTasks.get(taskId)!
      this.updateTaskStatus(task, TaskStatus.CANCELLED)
      if (task.timeoutId) clearTimeout(task.timeoutId)

      // Find worker running this task
      for (const [workerId, worker] of this.workers.entries()) {
        if (worker.currentTask === taskId) {
          // Send cancel message to worker
          worker.worker.postMessage({ type: "cancel" })

          // Mark worker as available
          worker.busy = false
          worker.currentTask = undefined
          worker.lastActiveAt = Date.now()
          break
        }
      }

      this.runningTasks.delete(taskId)

      // Update metrics
      this.metrics.cancelledTasks++
      this.metrics.currentRunningTasks = this.runningTasks.size

      // Process next task
      this.processNextTask()
      return true
    }

    return false
  }

  /**
   * Get task status
   */
  public getTaskStatus(taskId: string): TaskStatus | null {
    // Check running tasks
    if (this.runningTasks.has(taskId)) {
      return this.runningTasks.get(taskId)!.status
    }

    // Check queued tasks
    const queuedTask = this.taskQueue.find((task) => task.id === taskId)
    if (queuedTask) {
      return queuedTask.status
    }

    return null
  }

  /**
   * Get pool status
   */
  public getPoolStatus() {
    return {
      workers: {
        document: {
          total: Array.from(this.workers.values()).filter((w) => w.type === "document").length,
          busy: Array.from(this.workers.values()).filter((w) => w.type === "document" && w.busy).length,
        },
        text: {
          total: Array.from(this.workers.values()).filter((w) => w.type === "text").length,
          busy: Array.from(this.workers.values()).filter((w) => w.type === "text" && w.busy).length,
        },
      },
      tasks: {
        queued: this.taskQueue.length,
        running: this.runningTasks.size,
      },
      metrics: this.getMetrics(),
    }
  }

  /**
   * Process next task in queue
   */
  private processNextTask(): void {
    if (this.taskQueue.length === 0) return

    // Check if we're already at max concurrent tasks
    if (this.runningTasks.size >= (this.config.maxConcurrentTasks || DEFAULT_CONFIG.maxConcurrentTasks!)) {
      console.log(`Already at max concurrent tasks (${this.runningTasks.size}), waiting...`)
      return
    }

    // Find available workers for each type
    let availableWorkers: PoolWorker[] = []

    if (this.config.loadBalancingStrategy === "performance-based" && this.config.performanceTracking) {
      // Get all available workers sorted by performance
      availableWorkers = Array.from(this.workers.values())
        .filter((worker) => !worker.busy)
        .sort((a, b) => b.performance - a.performance)
    } else if (this.config.loadBalancingStrategy === "least-busy") {
      // Get all available workers sorted by task count
      availableWorkers = Array.from(this.workers.values())
        .filter((worker) => !worker.busy)
        .sort((a, b) => a.taskCount - b.taskCount)
    } else {
      // Default to round-robin (just get all available workers)
      availableWorkers = Array.from(this.workers.values()).filter((worker) => !worker.busy)
    }

    // Check if we need to create more workers
    const documentWorkers = Array.from(this.workers.values()).filter((w) => w.type === "document").length
    const textWorkers = Array.from(this.workers.values()).filter((w) => w.type === "text").length

    if (documentWorkers < (this.config.maxDocumentWorkers || DEFAULT_CONFIG.maxDocumentWorkers!)) {
      // Check if there are document tasks in queue
      const hasDocumentTasks = this.taskQueue.some((task) => task.workerType === "document")
      if (hasDocumentTasks) {
        this.createWorker("document")
      }
    }

    if (textWorkers < (this.config.maxTextWorkers || DEFAULT_CONFIG.maxTextWorkers!)) {
      // Check if there are text tasks in queue
      const hasTextTasks = this.taskQueue.some((task) => task.workerType === "text")
      if (hasTextTasks) {
        this.createWorker("text")
      }
    }

    // Find tasks that can be processed
    for (let i = 0; i < this.taskQueue.length; i++) {
      const task = this.taskQueue[i]

      // Find an available worker for this task type
      const availableWorker = availableWorkers.find((worker) => worker.type === task.workerType)

      if (availableWorker) {
        // Remove worker from available workers
        availableWorkers = availableWorkers.filter((w) => w.id !== availableWorker.id)

        // Remove task from queue
        this.taskQueue.splice(i, 1)
        i-- // Adjust index

        // Update metrics
        this.metrics.currentQueueLength = this.taskQueue.length

        // Assign task to worker
        this.assignTaskToWorker(task, availableWorker)

        // Check if we've reached max concurrent tasks
        if (this.runningTasks.size >= (this.config.maxConcurrentTasks || DEFAULT_CONFIG.maxConcurrentTasks!)) {
          break
        }
      }
    }
  }

  /**
   * Assign task to worker
   */
  private assignTaskToWorker(task: Task, worker: PoolWorker): void {
    // Mark worker as busy
    worker.busy = true
    worker.currentTask = task.id
    worker.lastActiveAt = Date.now()

    // Update task status
    task.status = TaskStatus.RUNNING
    task.startedAt = Date.now()
    if (task.onStatusChange) task.onStatusChange(TaskStatus.RUNNING)

    // Add to running tasks
    this.runningTasks.set(task.id, task)

    // Update metrics
    this.metrics.currentRunningTasks = this.runningTasks.size
    this.metrics.peakConcurrentTasks = Math.max(this.metrics.peakConcurrentTasks, this.runningTasks.size)

    // Record task start time for queue time calculation
    this.taskStartTimes.set(task.id, Date.now())

    // Calculate queue time
    const queueTime = task.startedAt - task.createdAt
    this.metrics.averageQueueTime =
      (this.metrics.averageQueueTime * this.metrics.totalTasksProcessed + queueTime) /
      (this.metrics.totalTasksProcessed + 1)

    // Set up message handler for this task
    const messageHandler = (event: MessageEvent) => {
      const { type, progress, result, error, stage } = event.data

      switch (type) {
        case "progress":
          task.progress = progress
          if (task.onProgress) task.onProgress(progress, stage)
          break

        case "complete":
          // Task completed successfully
          this.handleTaskCompletion(task, worker, result)
          worker.worker.removeEventListener("message", messageHandler)
          break

        case "error":
          // Task failed
          this.handleTaskError(task, worker, error)
          worker.worker.removeEventListener("message", messageHandler)
          break

        case "cancelled":
          // Task was cancelled
          this.handleTaskCancellation(task, worker)
          worker.worker.removeEventListener("message", messageHandler)
          break
      }
    }

    // Add message handler
    worker.worker.addEventListener("message", messageHandler)

    // Use circuit breaker if enabled
    if (this.config.useCircuitBreaker) {
      this.circuitBreaker
        .execute(() => {
          return new Promise<void>((resolve, reject) => {
            // Set up a one-time handler for initial acknowledgement
            const ackHandler = (event: MessageEvent) => {
              if (event.data.type === "ack") {
                worker.worker.removeEventListener("message", ackHandler)
                resolve()
              }
            }

            worker.worker.addEventListener("message", ackHandler)

            // Send task to worker with a timeout for acknowledgement
            worker.worker.postMessage({
              type: task.type,
              ...task.data,
            })

            // Set a timeout for acknowledgement
            setTimeout(() => {
              worker.worker.removeEventListener("message", ackHandler)
              reject(new Error("Worker failed to acknowledge task"))
            }, 5000)
          })
        })
        .catch((error) => {
          console.error(`Circuit breaker prevented task execution: ${error.message}`)
          this.handleTaskError(task, worker, `Task execution prevented by circuit breaker: ${error.message}`)
        })
    } else {
      // Send task to worker directly
      worker.worker.postMessage({
        type: task.type,
        ...task.data,
      })
    }

    worker.taskCount++

    // Update metrics
    this.metrics.totalTasksProcessed++
    this.metrics.taskTypeBreakdown[task.type]++
  }

  /**
   * Handle task completion
   */
  private handleTaskCompletion(task: Task, worker: PoolWorker, result: any): void {
    // Update task
    task.status = TaskStatus.COMPLETED
    task.progress = 100
    task.result = result
    task.completedAt = Date.now()

    // Record task history for performance metrics
    if (!this.taskHistory.has(task.type)) {
      this.taskHistory.set(task.type, [])
    }

    const duration = task.completedAt - (task.startedAt || task.createdAt)
    this.taskHistory.get(task.type)!.push({ success: true, duration })

    // Keep history limited to last 100 tasks
    if (this.taskHistory.get(task.type)!.length > 100) {
      this.taskHistory.get(task.type)!.shift()
    }

    // Clear timeout if set
    if (task.timeoutId) {
      clearTimeout(task.timeoutId)
      task.timeoutId = undefined
    }

    // Persist result if needed
    if (task.persistResult && task.storageKey) {
      storageService.setCache(task.storageKey, result, { expiry: 24 * 60 * 60 * 1000 }) // 24 hour expiry
    }

    // Call completion callback
    if (task.onComplete) task.onComplete(result)
    if (task.onStatusChange) task.onStatusChange(TaskStatus.COMPLETED)

    // Remove from running tasks
    this.runningTasks.delete(task.id)

    // Update metrics
    this.metrics.successfulTasks++
    this.metrics.currentRunningTasks = this.runningTasks.size
    this.tasksCompletedSinceLastCheck++

    // Calculate processing time
    const processingTime = duration
    this.metrics.averageProcessingTime =
      (this.metrics.averageProcessingTime * (this.metrics.successfulTasks - 1) + processingTime) /
      this.metrics.successfulTasks

    // Update worker performance metrics
    if (this.config.performanceTracking) {
      worker.totalTaskTime += duration
      worker.averageTaskDuration = (worker.averageTaskDuration * (worker.taskCount - 1) + duration) / worker.taskCount
      worker.successRate = (worker.successRate * (worker.taskCount - 1) + 1) / worker.taskCount

      // Calculate performance score (1-10)
      // Lower duration is better, higher success rate is better
      const durationScore = Math.max(1, 10 - worker.averageTaskDuration / 1000)
      const successScore = worker.successRate * 10
      worker.performance = (durationScore + successScore) / 2
    }

    // Mark worker as available
    worker.busy = false
    worker.currentTask = undefined
    worker.lastActiveAt = Date.now()

    // Check if worker needs to be recreated due to task count
    if (worker.taskCount >= (this.config.maxTasksPerWorker || DEFAULT_CONFIG.maxTasksPerWorker!)) {
      this.recreateWorker(worker)
    }

    // Process next task
    this.processNextTask()
  }

  /**
   * Handle task error
   */
  private handleTaskError(task: Task, worker: PoolWorker, error: string): void {
    console.error(`Task ${task.id} (${task.type}) error:`, error)

    // Check if we should retry
    if ((task.retryCount || 0) < (task.maxRetries || 0)) {
      task.retryCount = (task.retryCount || 0) + 1

      // Calculate retry delay with exponential backoff
      const delay = (task.retryDelay || 1000) * Math.pow(2, task.retryCount - 1)

      console.log(`Retrying task ${task.id} (attempt ${task.retryCount}/${task.maxRetries}) after ${delay}ms`)

      // Reset task status
      task.progress = 0
      task.status = TaskStatus.QUEUED

      // Add back to queue after delay
      setTimeout(() => {
        this.taskQueue.push(task)
        // Sort queue by priority
        this.taskQueue.sort((a, b) => a.priority - b.priority)
        // Update metrics
        this.metrics.currentQueueLength = this.taskQueue.length
        // Process next task
        this.processNextTask()
      }, delay)

      // Mark worker as available
      worker.busy = false
      worker.currentTask = undefined
      worker.lastActiveAt = Date.now()

      // Remove from running tasks
      this.runningTasks.delete(task.id)

      // Update metrics
      this.metrics.currentRunningTasks = this.runningTasks.size

      return
    }

    // Record task history for performance metrics
    if (!this.taskHistory.has(task.type)) {
      this.taskHistory.set(task.type, [])
    }

    const duration = Date.now() - (task.startedAt || task.createdAt)
    this.taskHistory.get(task.type)!.push({ success: false, duration })

    // Keep history limited to last 100 tasks
    if (this.taskHistory.get(task.type)!.length > 100) {
      this.taskHistory.get(task.type)!.shift()
    }

    // Update task
    task.status = TaskStatus.FAILED
    task.error = error
    task.completedAt = Date.now()

    // Clear timeout if set
    if (task.timeoutId) {
      clearTimeout(task.timeoutId)
      task.timeoutId = undefined
    }

    // Call error callback
    if (task.onError) task.onError(error)
    if (task.onStatusChange) task.onStatusChange(TaskStatus.FAILED)

    // Remove from running tasks
    this.runningTasks.delete(task.id)

    // Update metrics
    this.metrics.failedTasks++
    this.metrics.currentRunningTasks = this.runningTasks.size
    this.metrics.errorRate = this.metrics.failedTasks / this.metrics.totalTasksProcessed

    // Increment worker error count
    worker.errors++
    worker.lastErrorTime = Date.now()

    // Update worker performance metrics
    if (this.config.performanceTracking) {
      worker.successRate = (worker.successRate * (worker.taskCount - 1) + 0) / worker.taskCount

      // Calculate performance score (1-10)
      const successScore = worker.successRate * 10
      worker.performance = Math.max(1, (worker.performance + successScore) / 2)
    }

    // Check if worker needs to be recreated
    if (worker.errors >= (this.config.maxErrorsPerWorker || DEFAULT_CONFIG.maxErrorsPerWorker!)) {
      this.recreateWorker(worker)
    } else {
      // Mark worker as available
      worker.busy = false
      worker.currentTask = undefined
      worker.lastActiveAt = Date.now()
    }

    // Process next task
    this.processNextTask()
  }

  /**
   * Handle task cancellation
   */
  private handleTaskCancellation(task: Task, worker: PoolWorker): void {
    // Update task
    task.status = TaskStatus.CANCELLED
    task.completedAt = Date.now()

    // Clear timeout if set
    if (task.timeoutId) {
      clearTimeout(task.timeoutId)
      task.timeoutId = undefined
    }

    // Call status change callback
    if (task.onStatusChange) task.onStatusChange(TaskStatus.CANCELLED)

    // Remove from running tasks
    this.runningTasks.delete(task.id)

    // Update metrics
    this.metrics.cancelledTasks++
    this.metrics.currentRunningTasks = this.runningTasks.size

    // Mark worker as available
    worker.busy = false
    worker.currentTask = undefined
    worker.lastActiveAt = Date.now()

    // Process next task
    this.processNextTask()
  }

  /**
   * Handle task timeout
   */
  private handleTaskTimeout(taskId: string): void {
    // Check if task is in queue
    const queueIndex = this.taskQueue.findIndex((task) => task.id === taskId)
    if (queueIndex >= 0) {
      const task = this.taskQueue[queueIndex]
      task.error = "Task timed out while in queue"
      this.updateTaskStatus(task, TaskStatus.TIMEOUT)
      this.taskQueue.splice(queueIndex, 1)

      // Update metrics
      this.metrics.timeoutTasks++
      this.metrics.currentQueueLength = this.taskQueue.length

      return
    }

    // Check if task is running
    if (this.runningTasks.has(taskId)) {
      const task = this.runningTasks.get(taskId)!
      task.error = "Task execution timed out"

      // Find worker running this task
      for (const [workerId, worker] of this.workers.entries()) {
        if (worker.currentTask === taskId) {
          // Send cancel message to worker
          worker.worker.postMessage({ type: "cancel" })

          // Increment error count
          worker.errors++

          // Check if worker needs to be recreated
          if (worker.errors >= (this.config.maxErrorsPerWorker || DEFAULT_CONFIG.maxErrorsPerWorker!)) {
            this.recreateWorker(worker)
          } else {
            // Mark worker as available
            worker.busy = false
            worker.currentTask = undefined
            worker.lastActiveAt = Date.now()
          }

          break
        }
      }

      this.updateTaskStatus(task, TaskStatus.TIMEOUT)
      this.runningTasks.delete(taskId)

      // Update metrics
      this.metrics.timeoutTasks++
      this.metrics.currentRunningTasks = this.runningTasks.size

      // Process next task
      this.processNextTask()
    }
  }

  /**
   * Create a new worker
   */
  private createWorker(type: "document" | "text"): PoolWorker | null {
    if (!this.isWorkerSupported) return null

    try {
      let worker: Worker

      if (type === "document") {
        // Create document parser worker
        const workerBlob = new Blob(
          [`importScripts('${window.location.origin}/_next/static/chunks/workers/document-parser.worker.js');`],
          { type: "application/javascript" },
        )
        worker = new Worker(URL.createObjectURL(workerBlob))
      } else {
        // Create text processor worker
        const workerBlob = new Blob(
          [`importScripts('${window.location.origin}/_next/static/chunks/workers/text-processor.worker.js');`],
          { type: "application/javascript" },
        )
        worker = new Worker(URL.createObjectURL(workerBlob))
      }

      // Create worker object
      const id = this.generateWorkerId()
      const poolWorker: PoolWorker = {
        id,
        worker,
        type,
        busy: false,
        taskCount: 0,
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
        errors: 0,
        // Performance metrics
        performance: 5, // Start with middle performance score
        successRate: 1, // Start with perfect success rate
        averageTaskDuration: 0,
        totalTaskTime: 0,
      }

      // Add to workers map
      this.workers.set(id, poolWorker)

      // Set up error handler
      worker.onerror = (error) => {
        console.error(`Worker error (${type}):`, error)
        poolWorker.errors++

        // Check if worker needs to be recreated
        if (poolWorker.errors >= (this.config.maxErrorsPerWorker || DEFAULT_CONFIG.maxErrorsPerWorker!)) {
          this.recreateWorker(poolWorker)
        }
      }

      console.log(`Created new ${type} worker (${id})`)
      return poolWorker
    } catch (error) {
      console.error(`Failed to create ${type} worker:`, error)
      return null
    }
  }

  /**
   * Recreate a worker
   */
  private recreateWorker(worker: PoolWorker): void {
    console.log(`Recreating worker ${worker.id} (${worker.type}) after ${worker.errors} errors`)

    // Terminate old worker
    worker.worker.terminate()

    // Remove from workers map
    this.workers.delete(worker.id)

    // Create new worker of same type
    this.createWorker(worker.type)
  }

  /**
   * Perform maintenance on the worker pool
   */
  private performMaintenance(): void {
    const now = Date.now()
    const workerTimeout = this.config.workerTimeout || DEFAULT_CONFIG.workerTimeout!

    // Check for idle workers to terminate
    for (const [workerId, worker] of this.workers.entries()) {
      // Skip busy workers
      if (worker.busy) continue

      // Check if worker has been idle for too long
      if (now - worker.lastActiveAt > workerTimeout) {
        console.log(`Terminating idle worker ${workerId} (${worker.type})`)
        worker.worker.terminate()
        this.workers.delete(workerId)
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
    console.log("Worker pool status:", this.getPoolStatus())
  }

  /**
   * Update task status and call callback
   */
  private updateTaskStatus(task: Task, status: TaskStatus): void {
    task.status = status
    if (task.onStatusChange) task.onStatusChange(status)
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Generate unique worker ID
   */
  private generateWorkerId(): string {
    return `worker_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): PoolMetrics {
    return { ...this.metrics }
  }

  /**
   * Get task history for a specific type
   */
  public getTaskHistory(type: TaskType): { success: boolean; duration: number }[] {
    return this.taskHistory.get(type) || []
  }

  /**
   * Estimate task completion time
   */
  public estimateTaskCompletionTime(taskType: TaskType): number {
    // Get history for this task type
    const history = this.taskHistory.get(taskType)
    if (!history || history.length === 0) {
      return 5000 // Default 5 seconds if no history
    }

    // Calculate average duration of successful tasks
    const successfulTasks = history.filter((h) => h.success)
    if (successfulTasks.length === 0) {
      return 10000 // Default 10 seconds if no successful tasks
    }

    const avgDuration = successfulTasks.reduce((sum, h) => sum + h.duration, 0) / successfulTasks.length

    // Add 20% buffer
    return avgDuration * 1.2
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
    workerPoolInstance.shutdown()
    workerPoolInstance = null
  }
}

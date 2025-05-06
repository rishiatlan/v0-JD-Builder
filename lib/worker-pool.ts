// Worker Pool Manager
// Manages a pool of workers for efficient concurrent task processing

import { logMemoryUsage } from "./memory-optimization"

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
}

// Define task types
export enum TaskType {
  PARSE_TEXT = "parseText",
  PARSE_PDF = "parsePdf",
  PARSE_DOCX = "parseDocx",
  PROCESS_TEXT = "processText",
  ENHANCE_TEXT = "enhanceText",
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
}

// Configuration for the worker pool
interface WorkerPoolConfig {
  maxDocumentWorkers?: number
  maxTextWorkers?: number
  taskTimeout?: number // Default timeout in ms
  workerTimeout?: number // Time in ms after which an idle worker is terminated
  maxErrorsPerWorker?: number // Max errors before worker is recreated
}

// Default configuration
const DEFAULT_CONFIG: WorkerPoolConfig = {
  maxDocumentWorkers: 2,
  maxTextWorkers: 2,
  taskTimeout: 5 * 60 * 1000, // 5 minutes
  workerTimeout: 3 * 60 * 1000, // 3 minutes
  maxErrorsPerWorker: 3,
}

class WorkerPool {
  private workers: Map<string, PoolWorker> = new Map()
  private taskQueue: Task[] = []
  private runningTasks: Map<string, Task> = new Map()
  private config: WorkerPoolConfig
  private isInitialized = false
  private maintenanceInterval: NodeJS.Timeout | null = null
  private isWorkerSupported: boolean

  constructor(config: WorkerPoolConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.isWorkerSupported = typeof Worker !== "undefined"
  }

  // Initialize the worker pool
  public initialize(): void {
    if (this.isInitialized || !this.isWorkerSupported) return

    // Start maintenance interval
    this.maintenanceInterval = setInterval(() => this.performMaintenance(), 30000)
    this.isInitialized = true

    console.log("Worker pool initialized with config:", this.config)
  }

  // Shutdown the worker pool
  public shutdown(): void {
    if (!this.isInitialized) return

    // Clear maintenance interval
    if (this.maintenanceInterval) {
      clearInterval(this.maintenanceInterval)
      this.maintenanceInterval = null
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

  // Add a task to the pool
  public addTask(task: Omit<Task, "id" | "status" | "progress" | "createdAt">): string {
    if (!this.isWorkerSupported) {
      if (task.onError) task.onError("Web Workers are not supported in this browser")
      return ""
    }

    if (!this.isInitialized) this.initialize()

    const id = this.generateTaskId()
    const newTask: Task = {
      ...task,
      id,
      status: TaskStatus.QUEUED,
      progress: 0,
      createdAt: Date.now(),
    }

    // Set up task timeout if specified
    if (task.timeoutMs) {
      newTask.timeoutId = setTimeout(() => {
        this.handleTaskTimeout(id)
      }, task.timeoutMs)
    }

    // Add task to queue
    this.taskQueue.push(newTask)

    // Sort queue by priority
    this.taskQueue.sort((a, b) => a.priority - b.priority)

    // Try to process next task
    this.processNextTask()

    return id
  }

  // Cancel a task
  public cancelTask(taskId: string): boolean {
    // Check if task is in queue
    const queueIndex = this.taskQueue.findIndex((task) => task.id === taskId)
    if (queueIndex >= 0) {
      const task = this.taskQueue[queueIndex]
      this.updateTaskStatus(task, TaskStatus.CANCELLED)
      if (task.timeoutId) clearTimeout(task.timeoutId)
      this.taskQueue.splice(queueIndex, 1)
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

      // Process next task
      this.processNextTask()
      return true
    }

    return false
  }

  // Get task status
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

  // Get pool status
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
    }
  }

  // Process next task in queue
  private processNextTask(): void {
    if (this.taskQueue.length === 0) return

    // Find available workers for each type
    const availableDocumentWorkers = Array.from(this.workers.values()).filter(
      (worker) => worker.type === "document" && !worker.busy,
    )

    const availableTextWorkers = Array.from(this.workers.values()).filter(
      (worker) => worker.type === "text" && !worker.busy,
    )

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

      let availableWorker: PoolWorker | undefined

      if (task.workerType === "document" && availableDocumentWorkers.length > 0) {
        availableWorker = availableDocumentWorkers.shift()
      } else if (task.workerType === "text" && availableTextWorkers.length > 0) {
        availableWorker = availableTextWorkers.shift()
      }

      if (availableWorker) {
        // Remove task from queue
        this.taskQueue.splice(i, 1)
        i-- // Adjust index

        // Assign task to worker
        this.assignTaskToWorker(task, availableWorker)
      }
    }
  }

  // Assign task to worker
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

    // Send task to worker
    worker.worker.postMessage({
      type: task.type,
      ...task.data,
    })

    worker.taskCount++
  }

  // Handle task completion
  private handleTaskCompletion(task: Task, worker: PoolWorker, result: any): void {
    // Update task
    task.status = TaskStatus.COMPLETED
    task.progress = 100
    task.result = result
    task.completedAt = Date.now()

    // Clear timeout if set
    if (task.timeoutId) {
      clearTimeout(task.timeoutId)
      task.timeoutId = undefined
    }

    // Call completion callback
    if (task.onComplete) task.onComplete(result)
    if (task.onStatusChange) task.onStatusChange(TaskStatus.COMPLETED)

    // Remove from running tasks
    this.runningTasks.delete(task.id)

    // Mark worker as available
    worker.busy = false
    worker.currentTask = undefined
    worker.lastActiveAt = Date.now()

    // Process next task
    this.processNextTask()
  }

  // Handle task error
  private handleTaskError(task: Task, worker: PoolWorker, error: string): void {
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

    // Increment worker error count
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

    // Process next task
    this.processNextTask()
  }

  // Handle task cancellation
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

    // Mark worker as available
    worker.busy = false
    worker.currentTask = undefined
    worker.lastActiveAt = Date.now()

    // Process next task
    this.processNextTask()
  }

  // Handle task timeout
  private handleTaskTimeout(taskId: string): void {
    // Check if task is in queue
    const queueIndex = this.taskQueue.findIndex((task) => task.id === taskId)
    if (queueIndex >= 0) {
      const task = this.taskQueue[queueIndex]
      task.error = "Task timed out while in queue"
      this.updateTaskStatus(task, TaskStatus.FAILED)
      this.taskQueue.splice(queueIndex, 1)
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

      this.updateTaskStatus(task, TaskStatus.FAILED)
      this.runningTasks.delete(taskId)

      // Process next task
      this.processNextTask()
    }
  }

  // Create a new worker
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

  // Recreate a worker
  private recreateWorker(worker: PoolWorker): void {
    console.log(`Recreating worker ${worker.id} (${worker.type}) after ${worker.errors} errors`)

    // Terminate old worker
    worker.worker.terminate()

    // Remove from workers map
    this.workers.delete(worker.id)

    // Create new worker of same type
    this.createWorker(worker.type)
  }

  // Perform maintenance on the worker pool
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

    // Log pool status
    logMemoryUsage("Worker pool maintenance")
    console.log("Worker pool status:", this.getPoolStatus())
  }

  // Update task status and call callback
  private updateTaskStatus(task: Task, status: TaskStatus): void {
    task.status = status
    if (task.onStatusChange) task.onStatusChange(status)
  }

  // Generate unique task ID
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  // Generate unique worker ID
  private generateWorkerId(): string {
    return `worker_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
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

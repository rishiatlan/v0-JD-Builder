// Worker Manager
// Handles creation, communication, and cleanup of web workers

// Check if web workers are supported
export const isWorkerSupported = typeof Worker !== "undefined"

// Create a document parser worker
export function createDocumentParserWorker(): Worker | null {
  if (!isWorkerSupported) return null

  try {
    // Create worker with URL constructor for better compatibility
    const workerBlob = new Blob(
      [`importScripts('${window.location.origin}/_next/static/chunks/workers/document-parser.worker.js');`],
      { type: "application/javascript" },
    )
    return new Worker(URL.createObjectURL(workerBlob))
  } catch (error) {
    console.error("Failed to create document parser worker:", error)
    return null
  }
}

// Create a text processor worker
export function createTextProcessorWorker(): Worker | null {
  if (!isWorkerSupported) return null

  try {
    // Create worker with URL constructor for better compatibility
    const workerBlob = new Blob(
      [`importScripts('${window.location.origin}/_next/static/chunks/workers/text-processor.worker.js');`],
      { type: "application/javascript" },
    )
    return new Worker(URL.createObjectURL(workerBlob))
  } catch (error) {
    console.error("Failed to create text processor worker:", error)
    return null
  }
}

// Parse a text file using a worker
export function parseTextWithWorker(
  worker: Worker,
  file: File,
  chunkSize = 50000,
  onProgress?: (progress: number) => void,
  onError?: (error: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Set up message handler
    const handleMessage = (event: MessageEvent) => {
      const { type, result, progress, error } = event.data

      switch (type) {
        case "progress":
          if (onProgress) onProgress(progress)
          break

        case "complete":
          worker.removeEventListener("message", handleMessage)
          resolve(result)
          break

        case "error":
          worker.removeEventListener("message", handleMessage)
          if (onError) onError(error)
          reject(new Error(error))
          break

        case "cancelled":
          worker.removeEventListener("message", handleMessage)
          reject(new Error("Operation cancelled"))
          break
      }
    }

    worker.addEventListener("message", handleMessage)

    // Read file as ArrayBuffer
    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      worker.postMessage(
        {
          type: "parseText",
          fileData: arrayBuffer,
          fileName: file.name,
          fileType: file.type,
          chunkSize,
        },
        [arrayBuffer],
      ) // Transfer ownership of arrayBuffer to worker
    }

    reader.onerror = () => {
      worker.removeEventListener("message", handleMessage)
      reject(new Error("Failed to read file"))
    }

    reader.readAsArrayBuffer(file)
  })
}

// Parse a PDF file using a worker
export function parsePdfWithWorker(
  worker: Worker,
  file: File,
  onProgress?: (progress: number) => void,
  onError?: (error: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Set up message handler
    const handleMessage = (event: MessageEvent) => {
      const { type, result, progress, error } = event.data

      switch (type) {
        case "progress":
          if (onProgress) onProgress(progress)
          break

        case "complete":
          worker.removeEventListener("message", handleMessage)
          resolve(result)
          break

        case "error":
          worker.removeEventListener("message", handleMessage)
          if (onError) onError(error)
          reject(new Error(error))
          break

        case "cancelled":
          worker.removeEventListener("message", handleMessage)
          reject(new Error("Operation cancelled"))
          break
      }
    }

    worker.addEventListener("message", handleMessage)

    // Read file as ArrayBuffer
    const reader = new FileReader()
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer
      worker.postMessage(
        {
          type: "parsePdf",
          fileData: arrayBuffer,
        },
        [arrayBuffer],
      ) // Transfer ownership of arrayBuffer to worker
    }

    reader.onerror = () => {
      worker.removeEventListener("message", handleMessage)
      reject(new Error("Failed to read file"))
    }

    reader.readAsArrayBuffer(file)
  })
}

// Process text using a worker
export function processTextWithWorker(
  worker: Worker,
  text: string,
  chunkSize = 50000,
  onProgress?: (progress: number) => void,
  onError?: (error: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Set up message handler
    const handleMessage = (event: MessageEvent) => {
      const { type, result, progress, error, stage } = event.data

      switch (type) {
        case "progress":
          if (onProgress) onProgress(progress)
          break

        case "complete":
          worker.removeEventListener("message", handleMessage)
          resolve(result)
          break

        case "error":
          worker.removeEventListener("message", handleMessage)
          if (onError) onError(error)
          reject(new Error(error))
          break

        case "cancelled":
          worker.removeEventListener("message", handleMessage)
          reject(new Error("Operation cancelled"))
          break
      }
    }

    worker.addEventListener("message", handleMessage)

    // Send message to worker
    worker.postMessage({
      type: "processText",
      text,
      chunkSize,
    })
  })
}

// Enhance text using a worker
export function enhanceTextWithWorker(
  worker: Worker,
  text: string,
  options: any = {},
  onProgress?: (progress: number, stage?: string) => void,
  onError?: (error: string) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Set up message handler
    const handleMessage = (event: MessageEvent) => {
      const { type, result, progress, error, stage } = event.data

      switch (type) {
        case "progress":
          if (onProgress) onProgress(progress, stage)
          break

        case "complete":
          worker.removeEventListener("message", handleMessage)
          resolve(result)
          break

        case "error":
          worker.removeEventListener("message", handleMessage)
          if (onError) onError(error)
          reject(new Error(error))
          break

        case "cancelled":
          worker.removeEventListener("message", handleMessage)
          reject(new Error("Operation cancelled"))
          break
      }
    }

    worker.addEventListener("message", handleMessage)

    // Send message to worker
    worker.postMessage({
      type: "enhanceText",
      text,
      options,
    })
  })
}

// Cancel a worker operation
export function cancelWorkerOperation(worker: Worker): void {
  if (worker) {
    worker.postMessage({ type: "cancel" })
  }
}

// Terminate a worker
export function terminateWorker(worker: Worker | null): void {
  if (worker) {
    worker.terminate()
  }
}

/* eslint-disable no-restricted-globals */

// Text Processor Worker
// This worker handles heavy text processing operations off the main thread

// Define message types for type safety
interface ProcessTextMessage {
  type: "processText"
  text: string
  chunkSize: number
}

interface EnhanceTextMessage {
  type: "enhanceText"
  text: string
  options?: {
    removeRedundancy?: boolean
    enhanceLanguage?: boolean
    convertPassiveToActive?: boolean
    removeIntensifiers?: boolean
  }
}

interface CancelMessage {
  type: "cancel"
}

type WorkerMessage = ProcessTextMessage | EnhanceTextMessage | CancelMessage

// Track if operation is cancelled
let isCancelled = false

// Process text in chunks to avoid memory issues
async function processTextInChunks(text: string, chunkSize: number): Promise<string> {
  if (isCancelled) return ""

  const chunks: string[] = []
  for (let i = 0; i < text.length; i += chunkSize) {
    if (isCancelled) return ""

    const chunk = text.substring(i, Math.min(i + chunkSize, text.length))
    chunks.push(chunk)

    // Report progress
    const progress = Math.min(100, Math.round(((i + chunk.length) / text.length) * 100))
    self.postMessage({ type: "progress", progress })

    // Small delay to allow for cancellation checks
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return chunks.join("")
}

// Simple text enhancement function
// In a real implementation, this would contain the language processor logic
function enhanceText(text: string, options: any = {}): string {
  if (isCancelled) return ""

  // This is a simplified version - in reality, you would import and use the language processor
  let processedText = text

  // Report progress at different stages
  self.postMessage({ type: "progress", progress: 25, stage: "Analyzing text patterns" })

  // Simulate processing time
  const startTime = Date.now()
  while (Date.now() - startTime < 100) {
    // Busy wait to simulate processing
    if (isCancelled) return ""
  }

  self.postMessage({ type: "progress", progress: 50, stage: "Applying language enhancements" })

  // Remove redundancy if requested
  if (options.removeRedundancy !== false) {
    const redundantPatterns = [
      ["scalable and built for scale", "scalable"],
      ["innovative and creative", "innovative"],
      ["collaborate and work together", "collaborate"],
      ["plan and strategize", "strategize"],
      ["monitor and track", "monitor"],
    ]

    redundantPatterns.forEach(([pattern, replacement]) => {
      const regex = new RegExp(pattern, "gi")
      processedText = processedText.replace(regex, replacement)
    })
  }

  self.postMessage({ type: "progress", progress: 75, stage: "Refining language" })

  // Convert passive to active if requested
  if (options.convertPassiveToActive !== false) {
    const passivePatterns: Record<string, string> = {
      "responsible for": "own and lead",
      "in charge of": "lead",
      "tasked with": "drive",
      "assigned to": "own",
      "will be required to": "will",
    }

    Object.entries(passivePatterns).forEach(([passive, active]) => {
      const regex = new RegExp(`\\b${passive}\\b`, "gi")
      processedText = processedText.replace(regex, active)
    })
  }

  self.postMessage({ type: "progress", progress: 90, stage: "Finalizing enhancements" })

  return processedText
}

// Handle messages from the main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data

  // Reset cancellation flag for new operations
  if (message.type !== "cancel") {
    isCancelled = false
  }

  switch (message.type) {
    case "processText":
      try {
        const result = await processTextInChunks(message.text, message.chunkSize)
        if (!isCancelled) {
          self.postMessage({ type: "complete", result })
        }
      } catch (error) {
        if (!isCancelled) {
          self.postMessage({ type: "error", error: "Failed to process text" })
        }
      }
      break

    case "enhanceText":
      try {
        const result = enhanceText(message.text, message.options)
        if (!isCancelled) {
          self.postMessage({ type: "complete", result })
        }
      } catch (error) {
        if (!isCancelled) {
          self.postMessage({ type: "error", error: "Failed to enhance text" })
        }
      }
      break

    case "cancel":
      isCancelled = true
      self.postMessage({ type: "cancelled" })
      break

    default:
      self.postMessage({ type: "error", error: "Unknown message type" })
  }
}

// Handle errors
self.onerror = (error) => {
  self.postMessage({ type: "error", error: "Worker error: " + error.message })
}

export {}

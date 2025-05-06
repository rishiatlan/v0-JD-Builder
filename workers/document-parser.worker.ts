/* eslint-disable no-restricted-globals */

// Document Parser Worker
// This worker handles heavy document parsing operations off the main thread

import * as pdfjs from "pdfjs-dist"

// Initialize PDF.js worker
if (typeof self !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js"
}

// Define message types for type safety
interface ParseTextMessage {
  type: "parseText"
  fileData: ArrayBuffer
  fileName: string
  fileType: string
  chunkSize: number
}

interface ParsePdfMessage {
  type: "parsePdf"
  fileData: ArrayBuffer
}

interface ParseDocxMessage {
  type: "parseDocx"
  fileData: ArrayBuffer
}

interface ProcessTextMessage {
  type: "processText"
  text: string
  chunkSize: number
}

interface CancelMessage {
  type: "cancel"
}

type WorkerMessage = ParseTextMessage | ParsePdfMessage | ParseDocxMessage | ProcessTextMessage | CancelMessage

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

// Parse PDF file
async function parsePdf(fileData: ArrayBuffer): Promise<string> {
  try {
    const pdf = await pdfjs.getDocument({ data: fileData }).promise
    let fullText = ""

    for (let i = 1; i <= pdf.numPages; i++) {
      if (isCancelled) return ""

      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item: any) => item.str).join(" ")
      fullText += pageText + "\n\n"

      // Report progress
      const progress = Math.round((i / pdf.numPages) * 100)
      self.postMessage({ type: "progress", progress })

      // Release page resources
      page.cleanup()

      // Small delay to allow for cancellation checks
      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    return fullText
  } catch (error) {
    self.postMessage({ type: "error", error: "Failed to parse PDF file" })
    return ""
  }
}

// Parse text file
async function parseText(
  fileData: ArrayBuffer,
  fileName: string,
  fileType: string,
  chunkSize: number,
): Promise<string> {
  try {
    // Convert ArrayBuffer to string
    const decoder = new TextDecoder("utf-8")
    const text = decoder.decode(fileData)

    // Process in chunks to avoid memory issues
    return await processTextInChunks(text, chunkSize)
  } catch (error) {
    self.postMessage({ type: "error", error: "Failed to parse text file" })
    return ""
  }
}

// Handle messages from the main thread
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data

  // Reset cancellation flag for new operations
  if (message.type !== "cancel") {
    isCancelled = false
  }

  switch (message.type) {
    case "parseText":
      try {
        const result = await parseText(message.fileData, message.fileName, message.fileType, message.chunkSize)
        if (!isCancelled) {
          self.postMessage({ type: "complete", result })
        }
      } catch (error) {
        if (!isCancelled) {
          self.postMessage({ type: "error", error: "Failed to parse text" })
        }
      }
      break

    case "parsePdf":
      try {
        const result = await parsePdf(message.fileData)
        if (!isCancelled) {
          self.postMessage({ type: "complete", result })
        }
      } catch (error) {
        if (!isCancelled) {
          self.postMessage({ type: "error", error: "Failed to parse PDF" })
        }
      }
      break

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

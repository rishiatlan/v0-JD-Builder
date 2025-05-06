/**
 * Utility functions for memory optimization when handling large documents
 */

// Check if the browser supports performance memory API
export const hasMemoryAPI = () => {
  return typeof performance !== "undefined" && "memory" in performance && performance.memory !== undefined
}

// Get current memory usage if available
export const getCurrentMemoryUsage = (): number | null => {
  if (hasMemoryAPI()) {
    // @ts-ignore - TypeScript doesn't know about the memory property
    return performance.memory.usedJSHeapSize
  }
  return null
}

// Log memory usage for debugging
export const logMemoryUsage = (label: string) => {
  if (hasMemoryAPI()) {
    // @ts-ignore - TypeScript doesn't know about the memory property
    const used = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
    // @ts-ignore
    const total = Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
    // @ts-ignore
    const limit = Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
    console.log(`Memory [${label}]: ${used}MB used / ${total}MB total (${limit}MB limit)`)
  }
}

// Force garbage collection if possible (only works in some environments)
export const attemptGarbageCollection = () => {
  if (typeof window !== "undefined" && "gc" in window) {
    try {
      // @ts-ignore - gc is not a standard method
      window.gc()
      return true
    } catch (e) {
      return false
    }
  }
  return false
}

// Check if memory usage is high
export const isMemoryUsageHigh = (thresholdPercentage = 80): boolean => {
  if (hasMemoryAPI()) {
    // @ts-ignore
    const used = performance.memory.usedJSHeapSize
    // @ts-ignore
    const limit = performance.memory.jsHeapSizeLimit
    return (used / limit) * 100 > thresholdPercentage
  }
  return false
}

// Estimate memory needed for a string of given length
export const estimateStringMemoryUsage = (length: number): number => {
  // In JavaScript, each character typically uses 2 bytes (UTF-16)
  // Plus some overhead for the string object itself
  return length * 2 + 40 // 40 bytes for object overhead (approximate)
}

// Check if a string is too large to process at once
export const isStringTooLarge = (length: number, maxMB = 50): boolean => {
  const estimatedMB = estimateStringMemoryUsage(length) / (1024 * 1024)
  return estimatedMB > maxMB
}

// Create a memory-efficient substring that doesn't keep references to the original string
export const efficientSubstring = (str: string, start: number, end: number): string => {
  // Create a new string to avoid reference to the original large string
  return (" " + str.substring(start, end)).slice(1)
}

// Release references to large objects
export const releaseMemory = (obj: any) => {
  if (Array.isArray(obj)) {
    // Clear array
    obj.length = 0
  } else if (typeof obj === "object" && obj !== null) {
    // Clear object properties
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        delete obj[key]
      }
    }
  }
  // Return null to help with garbage collection
  return null
}

// Process a large string in chunks with memory monitoring
export async function processStringInChunks<T>(
  str: string,
  chunkSize: number,
  processor: (chunk: string, index: number) => Promise<T> | T,
  onProgress?: (progress: number) => void,
  maxMemoryUsagePercent = 80,
): Promise<T[]> {
  const results: T[] = []
  const totalChunks = Math.ceil(str.length / chunkSize)

  for (let i = 0; i < totalChunks; i++) {
    // Check memory usage before processing next chunk
    if (isMemoryUsageHigh(maxMemoryUsagePercent)) {
      // Wait for garbage collection
      await new Promise((resolve) => setTimeout(resolve, 100))
      attemptGarbageCollection()
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // Extract chunk efficiently
    const start = i * chunkSize
    const end = Math.min(start + chunkSize, str.length)
    const chunk = efficientSubstring(str, start, end)

    // Process chunk
    const result = await Promise.resolve(processor(chunk, i))
    results.push(result)

    // Update progress
    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalChunks) * 100))
    }

    // Small delay to allow UI updates and garbage collection
    await new Promise((resolve) => setTimeout(resolve, 10))
  }

  return results
}

// Stream reader for large files
export const createStreamReader = (file: File, chunkSize = 64 * 1024) => {
  const fileSize = file.size
  let offset = 0

  return {
    async readNextChunk(): Promise<{ chunk: string; done: boolean }> {
      if (offset >= fileSize) {
        return { chunk: "", done: true }
      }

      const slice = file.slice(offset, offset + chunkSize)
      const text = await readBlobAsText(slice)
      offset += chunkSize

      return {
        chunk: text,
        done: offset >= fileSize,
      }
    },

    getProgress(): number {
      return Math.min(100, Math.round((offset / fileSize) * 100))
    },
  }
}

// Helper to read blob as text
const readBlobAsText = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(blob)
  })
}

// Compress string data in memory (simple implementation)
export const compressString = (str: string): string => {
  // This is a very simple implementation
  // In a real app, you might use a proper compression library
  // or the browser's CompressionStream API

  // Simple run-length encoding for repeated characters
  let compressed = ""
  let count = 1
  let current = str[0] || ""

  for (let i = 1; i < str.length; i++) {
    if (str[i] === current) {
      count++
    } else {
      compressed += count > 3 ? `${current}${count}` : current.repeat(count)
      current = str[i]
      count = 1
    }
  }

  compressed += count > 3 ? `${current}${count}` : current.repeat(count)

  // Only use compression if it actually saves space
  return compressed.length < str.length ? compressed : str
}

// Decompress a string compressed with compressString
export const decompressString = (compressed: string): string => {
  // Simple decompression for the run-length encoding above
  let decompressed = ""
  let i = 0

  while (i < compressed.length) {
    const char = compressed[i]
    i++

    // Check if followed by a number
    let countStr = ""
    while (i < compressed.length && /\d/.test(compressed[i])) {
      countStr += compressed[i]
      i++
    }

    if (countStr) {
      const count = Number.parseInt(countStr, 10)
      decompressed += char.repeat(count)
    } else {
      decompressed += char
    }
  }

  return decompressed
}

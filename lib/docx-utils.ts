/**
 * Utility functions for DOCX parsing
 */

/**
 * Parse a DOCX file and extract its text content
 * @param file The DOCX file to parse
 * @returns The extracted text content
 */
export async function parseDocxFile(file: File): Promise<string> {
  try {
    // Load mammoth.js
    const mammoth = await import("mammoth")

    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // Extract text from DOCX
    const result = await mammoth.extractRawText({ arrayBuffer })

    // Check if we got valid content
    if (!result.value || result.value.trim().length === 0) {
      throw new Error("No text content could be extracted from the DOCX file.")
    }

    return result.value
  } catch (error) {
    console.error("Primary DOCX parsing failed:", error)

    // Try alternative method
    try {
      const docx2html = await import("docx2html")
      const arrayBuffer = await file.arrayBuffer()

      const htmlResult = await docx2html.default(arrayBuffer)

      // Convert HTML to plain text
      const tempDiv = document.createElement("div")
      tempDiv.innerHTML = htmlResult
      const text = tempDiv.textContent || tempDiv.innerText || ""

      if (text.trim().length === 0) {
        throw new Error("No text content could be extracted from the DOCX file.")
      }

      return text
    } catch (fallbackError) {
      console.error("Fallback DOCX parsing failed:", fallbackError)
      throw new Error("Failed to parse DOCX file. The file may be corrupted or in an unsupported format.")
    }
  }
}

/**
 * Check if a file is a DOCX file
 * @param file The file to check
 * @returns True if the file is a DOCX file, false otherwise
 */
export function isDocxFile(file: File): boolean {
  return file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
}

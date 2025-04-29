"use server"

import { generateAtlanJD, getRefinementSuggestions, checkForBias, generateWithGemini } from "@/lib/openhands"

// Server action to generate a JD based on intake form data
export async function generateJD(formData: FormData) {
  try {
    console.log("generateJD action called")

    const data = {
      title: formData.get("title") as string,
      department: formData.get("department") as string,
      outcomes: formData.get("outcomes") as string,
      mindset: formData.get("mindset") as string,
      advantage: formData.get("advantage") as string,
      decisions: formData.get("decisions") as string,
    }

    // Validate input data
    const missingFields = Object.entries(data)
      .filter(([_, value]) => !value || value.trim() === "")
      .map(([key]) => key)

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields)
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      }
    }

    console.log("Calling generateAtlanJD with data:", JSON.stringify(data))

    // Generate JD using OpenHands and Gemini
    const jdData = await generateAtlanJD(data)

    if (!jdData || !jdData.sections) {
      console.error("Invalid JD data returned:", jdData)
      return {
        success: false,
        error: "Failed to generate valid job description data. Please try again.",
      }
    }

    console.log("JD generated successfully:", Object.keys(jdData))

    // Return the generated JD data
    return {
      success: true,
      data: {
        title: data.title,
        department: data.department,
        ...jdData,
      },
    }
  } catch (error) {
    console.error("Error generating JD:", error)
    return {
      success: false,
      error: "Failed to generate job description. Please try again.",
    }
  }
}

// Server action to get refinement suggestions for a specific section
export async function getSectionRefinements(section: string, content: string) {
  try {
    console.log(`getSectionRefinements action called for section: ${section}`)

    if (!section || !content || content.trim() === "") {
      return {
        success: false,
        error: "Missing section or content",
      }
    }

    const suggestions = await getRefinementSuggestions(section, content)

    if (!Array.isArray(suggestions)) {
      console.error("Invalid suggestions returned:", suggestions)
      return {
        success: false,
        error: "Failed to get valid refinement suggestions. Please try again.",
      }
    }

    console.log(`Got ${suggestions.length} refinement suggestions for ${section}`)

    return {
      success: true,
      suggestions,
    }
  } catch (error) {
    console.error("Error getting refinement suggestions:", error)
    return {
      success: false,
      error: "Failed to get refinement suggestions. Please try again.",
    }
  }
}

// Server action to check for bias in JD content
export async function checkJDForBias(content: string) {
  try {
    console.log("checkJDForBias action called")

    if (!content || content.trim() === "") {
      return {
        success: false,
        error: "Missing content to check",
      }
    }

    const biasFlags = await checkForBias(content)

    if (!Array.isArray(biasFlags)) {
      console.error("Invalid bias flags returned:", biasFlags)
      return {
        success: false,
        error: "Failed to check for bias. Please try again.",
      }
    }

    console.log(`Found ${biasFlags.length} potential bias flags`)

    return {
      success: true,
      biasFlags,
    }
  } catch (error) {
    console.error("Error checking for bias:", error)
    return {
      success: false,
      error: "Failed to check for bias. Please try again.",
    }
  }
}

// Server action to analyze a document upload
export async function analyzeUploadedDocument(fileContent: string) {
  try {
    console.log("analyzeUploadedDocument action called")

    if (!fileContent || fileContent.trim() === "") {
      return {
        success: false,
        error: "Empty file content provided",
      }
    }

    console.log("File content length:", fileContent.length)

    // For document uploads, we'll extract information and then generate a JD
    const prompt = `
      Extract key information from the following document to create a job description:
      
      ${fileContent.substring(0, 10000)} ${fileContent.length > 10000 ? "... (content truncated)" : ""}
      
      Extract and format the response as a JSON object with the following structure:
      {
        "title": "...",
        "department": "...",
        "outcomes": "...",
        "mindset": "...",
        "advantage": "...",
        "decisions": "..."
      }
      
      IMPORTANT: Your response must be valid JSON that can be parsed with JSON.parse().
    `

    // Use OpenHands to extract information
    console.log("Calling generateWithGemini to extract information from document")
    const extractedInfoText = await generateWithGemini(prompt)
    console.log("Raw extracted info:", extractedInfoText.substring(0, 200) + "...")

    // Try to extract JSON if the response contains non-JSON text
    let jsonStr = extractedInfoText

    // Look for JSON-like structure if the response isn't pure JSON
    if (!jsonStr.trim().startsWith("{")) {
      const jsonMatch = extractedInfoText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
        console.log("Extracted JSON from response:", jsonStr.substring(0, 200) + "...")
      }
    }

    let parsedInfo
    try {
      parsedInfo = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error("JSON parsing error for extracted info:", parseError)
      return {
        success: false,
        error:
          "Failed to extract structured information from the document. Please try again or use the questionnaire instead.",
      }
    }

    // Validate extracted information
    const requiredFields = ["title", "department", "outcomes", "mindset", "advantage", "decisions"]
    const missingFieldsExtracted = requiredFields.filter((field) => !parsedInfo[field])

    if (missingFieldsExtracted.length > 0) {
      console.error("Missing required fields in extracted info:", missingFieldsExtracted)
      return {
        success: false,
        error: `Failed to extract all required information from the document. Missing: ${missingFieldsExtracted.join(", ")}. Please try again or use the questionnaire instead.`,
      }
    }

    console.log("Successfully extracted information:", JSON.stringify(parsedInfo))

    // Generate JD using the extracted information
    console.log("Calling generateAtlanJD with extracted information")
    const jdData = await generateAtlanJD(parsedInfo)

    if (!jdData || !jdData.sections) {
      console.error("Invalid JD data returned:", jdData)
      return {
        success: false,
        error: "Failed to generate valid job description data. Please try again.",
      }
    }

    console.log("JD generated successfully from document:", Object.keys(jdData))

    return {
      success: true,
      data: {
        title: parsedInfo.title,
        department: parsedInfo.department,
        ...jdData,
      },
    }
  } catch (error) {
    console.error("Error analyzing uploaded document:", error)
    return {
      success: false,
      error: "Failed to analyze the uploaded document. Please try again.",
    }
  }
}

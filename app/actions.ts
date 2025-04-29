"use server"

import { generateAtlanJD, getRefinementSuggestions, checkForBias, generateWithGemini } from "@/lib/openhands"

// Add this function to sanitize years of experience phrases
function sanitizeYearsOfExperience(text: string): string {
  if (!text) return text

  const bannedPatterns = [
    /(\d+)\+?\s*years? of experience/gi,
    /at least (\d+)\s*years/gi,
    /minimum of (\d+)\s*years/gi,
    /(\d+)\+?\s*years? in/gi,
    /experience of (\d+)\+?\s*years/gi,
  ]

  const replacements = ["proven experience", "demonstrated ability", "track record", "solid background", "proficiency"]

  let sanitizedText = text

  for (const pattern of bannedPatterns) {
    sanitizedText = sanitizedText.replace(pattern, () => {
      // Get a random replacement phrase
      const replacement = replacements[Math.floor(Math.random() * replacements.length)]
      return replacement
    })
  }

  return sanitizedText
}

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

    try {
      // Generate JD using OpenHands and Gemini
      const jdData = await generateAtlanJD(data)

      if (!jdData || !jdData.sections) {
        console.error("Invalid JD data returned:", jdData)
        return {
          success: false,
          error: "Failed to generate valid job description data. Please try again.",
        }
      }

      // Additional sanitization at the server action level as a safety net
      if (jdData.sections) {
        // Sanitize overview
        if (jdData.sections.overview) {
          jdData.sections.overview = sanitizeYearsOfExperience(jdData.sections.overview)
        }

        // Sanitize responsibilities
        if (Array.isArray(jdData.sections.responsibilities)) {
          jdData.sections.responsibilities = jdData.sections.responsibilities.map((item) =>
            sanitizeYearsOfExperience(item),
          )
        } else if (jdData.sections.responsibilities) {
          jdData.sections.responsibilities = sanitizeYearsOfExperience(jdData.sections.responsibilities)
        }

        // Sanitize qualifications
        if (Array.isArray(jdData.sections.qualifications)) {
          jdData.sections.qualifications = jdData.sections.qualifications.map((item) => sanitizeYearsOfExperience(item))
        } else if (jdData.sections.qualifications) {
          jdData.sections.qualifications = sanitizeYearsOfExperience(jdData.sections.qualifications)
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
      console.error("Error in AI service:", error)

      // Return a friendly error message
      return {
        success: false,
        error: "The AI service is currently unavailable. Please try again in a few moments.",
      }
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

    try {
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
      console.error("Error in AI service for refinements:", error)

      // Return a friendly error message
      return {
        success: false,
        error: "The AI service is currently unavailable for refinements. Please try again in a few moments.",
      }
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

    try {
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
      console.error("Error in AI service for bias check:", error)

      // Return a friendly error message
      return {
        success: false,
        error: "The AI service is currently unavailable for bias checking. Please try again in a few moments.",
      }
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
      
      ${fileContent.substring(0, 5000)} ${fileContent.length > 5000 ? "... (content truncated)" : ""}
      
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

    try {
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

        // Create a basic extraction from the document
        parsedInfo = extractBasicInfoFromDocument(fileContent)
      }

      // Validate extracted information
      const requiredFields = ["title", "department", "outcomes", "mindset", "advantage", "decisions"]
      const missingFieldsExtracted = requiredFields.filter((field) => !parsedInfo[field])

      if (missingFieldsExtracted.length > 0) {
        console.error("Missing required fields in extracted info:", missingFieldsExtracted)

        // Fill in missing fields with basic placeholders
        missingFieldsExtracted.forEach((field) => {
          parsedInfo[field] = `Information about ${field} extracted from document`
        })
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
      console.error("Error in AI service for document analysis:", error)

      // Create a basic JD from the document content
      const basicInfo = extractBasicInfoFromDocument(fileContent)
      const jdData = {
        sections: {
          overview: `This role involves responsibilities related to ${basicInfo.title} in the ${basicInfo.department} department.`,
          responsibilities: [
            "Lead key initiatives and projects",
            "Collaborate with cross-functional teams",
            "Drive strategic outcomes",
            "Implement best practices",
            "Analyze and report on results",
          ],
          qualifications: [
            "Experience in relevant field",
            "Strong communication skills",
            "Analytical thinking",
            "Problem-solving abilities",
            "Team collaboration",
          ],
        },
        analysis: {
          clarity: 70,
          inclusivity: 80,
          seo: 65,
          attraction: 75,
        },
        isTemplateFallback: true,
      }

      return {
        success: true,
        data: {
          title: basicInfo.title,
          department: basicInfo.department,
          ...jdData,
        },
      }
    }
  } catch (error) {
    console.error("Error analyzing uploaded document:", error)
    return {
      success: false,
      error: "Failed to analyze the uploaded document. Please try again.",
    }
  }
}

// Helper function to extract basic information from document content
function extractBasicInfoFromDocument(content: string): any {
  // Simple extraction logic based on common patterns in job descriptions
  let title = "Position"
  let department = "Department"

  // Try to extract title
  const titleMatches = content.match(/(?:job title|position|role)[\s:]+([^\n.]+)/i)
  if (titleMatches && titleMatches[1]) {
    title = titleMatches[1].trim()
  } else {
    // Look for patterns like "Senior Software Engineer"
    const commonTitles = [
      "Engineer",
      "Manager",
      "Director",
      "Specialist",
      "Analyst",
      "Developer",
      "Designer",
      "Coordinator",
      "Assistant",
      "Lead",
    ]

    for (const titleWord of commonTitles) {
      const regex = new RegExp(`(\\w+\\s+${titleWord}|${titleWord})`, "i")
      const match = content.match(regex)
      if (match && match[1]) {
        title = match[1].trim()
        break
      }
    }
  }

  // Try to extract department
  const deptMatches = content.match(/(?:department|team|division)[\s:]+([^\n.]+)/i)
  if (deptMatches && deptMatches[1]) {
    department = deptMatches[1].trim()
  } else {
    // Look for common department names
    const commonDepts = [
      "Engineering",
      "Marketing",
      "Sales",
      "Finance",
      "HR",
      "Product",
      "Design",
      "Operations",
      "Support",
      "Research",
    ]

    for (const dept of commonDepts) {
      if (content.includes(dept)) {
        department = dept
        break
      }
    }
  }

  return {
    title,
    department,
    outcomes: "Drive key results and outcomes for the organization",
    mindset: "Strategic thinking and problem-solving approach",
    advantage: "Contribute to organizational growth and innovation",
    decisions: "Balance priorities and make data-driven decisions",
  }
}

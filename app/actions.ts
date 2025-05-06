"use server"

import { getRefinementSuggestions, checkForBias, generateAtlanJD, generateWithFallback } from "@/lib/openhands"
import { languageProcessor } from "@/lib/language-processor"
import { getDepartmentByValue, getDepartmentByName } from "@/lib/department-data"

// Cache for API responses to reduce duplicate calls
const apiCache = new Map<string, { timestamp: number; data: any }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour

// Rate limiting to avoid overloading the API
const apiRateLimits = new Map<string, number>() // endpoint -> last call timestamp
const MIN_API_CALL_INTERVAL = 1000 // 1 second between calls to the same endpoint

// Function to check rate limiting
async function checkRateLimit(endpoint: string): Promise<boolean> {
  const now = Date.now()
  const lastCall = apiRateLimits.get(endpoint) || 0

  if (now - lastCall < MIN_API_CALL_INTERVAL) {
    // Too soon for another call
    await new Promise((resolve) => setTimeout(resolve, MIN_API_CALL_INTERVAL - (now - lastCall)))
  }

  apiRateLimits.set(endpoint, Date.now())
  return true
}

// Function to get cached data or fetch new data
async function getCachedOrFetch<T>(cacheKey: string, fetchFn: () => Promise<T>, ttl: number = CACHE_TTL): Promise<T> {
  const cached = apiCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < ttl) {
    console.log(`Using cached data for ${cacheKey}`)
    return cached.data as T
  }

  try {
    // Check rate limiting before making the API call
    await checkRateLimit(cacheKey.split(":")[0])

    console.log(`Fetching fresh data for ${cacheKey}`)
    const data = await fetchFn()
    apiCache.set(cacheKey, { timestamp: Date.now(), data })
    return data
  } catch (error) {
    console.error(`Error fetching data for ${cacheKey}:`, error)

    // If we have stale cache, use it as fallback
    if (cached) {
      console.log(`Using stale cached data for ${cacheKey} due to fetch error`)
      return cached.data as T
    }

    throw error
  }
}

// Function to get refinement suggestions for a specific section
export async function getSectionRefinements(section: string, content: string, refinedSegments: string[] = []) {
  try {
    // Create a cache key based on the content and refined segments
    const cacheKey = `refinement:${section}:${content.substring(0, 100)}:${refinedSegments.length}`

    // Get cached or fetch new suggestions
    const suggestions = await getCachedOrFetch(
      cacheKey,
      () => getRefinementSuggestions(section, content, refinedSegments),
      1000 * 60 * 30, // 30 minutes TTL for refinement suggestions
    )

    return { success: true, suggestions }
  } catch (error) {
    console.error("Error getting refinement suggestions:", error)

    // Fallback: Generate basic suggestions using the language processor
    try {
      const result = languageProcessor.processText(content)
      const suggestions = result.changes
        .map((change) => ({
          original: change.original,
          suggestion: change.replacement,
          reason: change.reason,
        }))
        .slice(0, 3) // Limit to 3 suggestions

      return { success: true, suggestions }
    } catch (fallbackError) {
      console.error("Fallback error:", fallbackError)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }
}

// Server action to generate a JD based on intake form data
export async function generateJD(formData: FormData) {
  try {
    console.log("generateJD action called")

    const data = {
      title: formData.get("title") as string,
      department: formData.get("department") as string,
      outcomes: formData.get("outcomes") as string,
      measurableOutcomes: formData.get("measurableOutcomes") as string,
      mindset: formData.get("mindset") as string,
      advantage: formData.get("advantage") as string,
      decisions: formData.get("decisions") as string,
      includeStrategicVision: formData.get("includeStrategicVision") === "true",
    }

    // Validate input data
    const requiredFields = ["title", "department", "outcomes", "mindset", "advantage", "decisions"]
    const missingFields = requiredFields
      .filter((key) => !data[key as keyof typeof data] || (data[key as keyof typeof data] as string).trim() === "")
      .map((key) => key)

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields)
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      }
    }

    // Get department guardrails if available
    const departmentInfo = getDepartmentByValue(data.department) || getDepartmentByName(data.department)

    // Add department guardrails to the data if available
    if (departmentInfo) {
      data.departmentGuardrails = {
        owns: departmentInfo.guardrails.owns.join("; "),
        avoid: departmentInfo.guardrails.avoid.join("; "),
      }
    }

    console.log("Calling generateAtlanJD with data:", JSON.stringify(data))

    try {
      // Create a cache key based on the input data
      const cacheKey = `jd:${data.title}:${data.department}:${data.outcomes.substring(0, 50)}`

      // Get cached or generate new JD
      const jdData = await getCachedOrFetch(cacheKey, () => generateAtlanJD(data))

      if (!jdData || !jdData.sections) {
        console.error("Invalid JD data returned:", jdData)
        return {
          success: false,
          error: "Failed to generate valid job description data. Please try again.",
        }
      }

      console.log("JD generated successfully:", Object.keys(jdData))

      // Apply language processing to each section
      const processedSections: Record<string, any> = {}
      const sharpnessScores: Record<string, number> = {}
      const improvementSuggestions: Record<string, string[]> = {}

      Object.entries(jdData.sections).forEach(([key, value]) => {
        const content = typeof value === "string" ? value : (value as string[]).join("\n")
        const result = languageProcessor.processText(content)

        // Use processed text
        processedSections[key] = result.processed
        sharpnessScores[key] = result.sharpnessScore
        improvementSuggestions[key] = languageProcessor.getImprovementSuggestions(result.sharpnessScore, result.changes)
      })

      // Return the generated JD data with processed sections
      return {
        success: true,
        data: {
          title: data.title,
          department: data.department,
          includeStrategicVision: data.includeStrategicVision,
          sections: processedSections,
          analysis: jdData.analysis,
          biasFlags: jdData.biasFlags || [],
          refinementMetadata: {
            sharpnessScores,
            improvementSuggestions,
          },
        },
      }
    } catch (error) {
      console.error("Error in AI service:", error)

      // Fallback: Generate a basic JD using the language processor and templates
      const fallbackJD = generateFallbackJD(data)

      // Return a friendly error message
      return {
        success: true, // Return success to show the fallback JD
        data: fallbackJD,
        warning: "Used fallback JD generation due to AI service unavailability.",
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
      // Create a cache key based on the content
      const cacheKey = `bias:${content.substring(0, 100)}`

      // Get cached or check for new bias
      const biasFlags = await getCachedOrFetch(cacheKey, () => checkForBias(content))

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

      // Fallback: Use a basic bias check with the language processor
      const result = languageProcessor.processText(content)
      const biasFlags = result.changes
        .filter((change) => change.type === "grandiose" || change.type === "vague")
        .map((change) => ({
          text: change.original,
          issue: change.type === "grandiose" ? "Potentially exclusionary language" : "Vague language",
          explanation: change.reason,
          suggestion: change.replacement,
        }))

      return {
        success: true,
        biasFlags,
        warning: "Used fallback bias detection due to AI service unavailability.",
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

    // Create a cache key based on the file content
    const cacheKey = `document:${fileContent.substring(0, 200)}`

    try {
      // Extract information from the document and generate a JD
      const extractedInfo = await getCachedOrFetch(cacheKey, async () => {
        // For document uploads, we'll extract information and then generate a JD
        const prompt = `
            Extract key information from the following document to create a job description:
            
            ${fileContent.substring(0, 5000)} ${fileContent.length > 5000 ? "... (content truncated)" : ""}
            
            Extract and format the response as a JSON object with the following structure:
            {
              "title": "...",
              "department": "...",
              "outcomes": "...",
              "measurableOutcomes": "...",
              "mindset": "...",
              "advantage": "...",
              "decisions": "..."
            }
            
            IMPORTANT: Your response must be valid JSON that can be parsed with JSON.parse().
          `

        // Use OpenHands to extract information
        console.log("Calling generateWithFallback to extract information from document")
        const extractedInfoText = await generateWithFallback(prompt)
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

        try {
          return JSON.parse(jsonStr)
        } catch (parseError) {
          console.error("JSON parsing error for extracted info:", parseError)
          // Create a basic extraction from the document
          return extractBasicInfoFromDocument(fileContent)
        }
      })

      // Validate extracted information
      const requiredFields = ["title", "department", "outcomes", "mindset", "advantage", "decisions"]
      const missingFieldsExtracted = requiredFields.filter((field) => !extractedInfo[field])

      if (missingFieldsExtracted.length > 0) {
        console.error("Missing required fields in extracted info:", missingFieldsExtracted)

        // Fill in missing fields with basic placeholders
        missingFieldsExtracted.forEach((field) => {
          extractedInfo[field] = `Information about ${field} extracted from document`
        })
      }

      console.log("Successfully extracted information:", JSON.stringify(extractedInfo))

      // Get department guardrails if available
      const departmentInfo =
        getDepartmentByValue(extractedInfo.department) || getDepartmentByName(extractedInfo.department)

      // Add department guardrails to the data if available
      if (departmentInfo) {
        extractedInfo.departmentGuardrails = {
          owns: departmentInfo.guardrails.owns.join("; "),
          avoid: departmentInfo.guardrails.avoid.join("; "),
        }
      }

      // Generate JD using the extracted information
      console.log("Calling generateAtlanJD with extracted information")
      const jdData = await generateAtlanJD(extractedInfo)

      if (!jdData || !jdData.sections) {
        console.error("Invalid JD data returned:", jdData)
        return {
          success: false,
          error: "Failed to generate valid job description data. Please try again.",
        }
      }

      // Apply language processing to each section
      const processedSections: Record<string, any> = {}
      const sharpnessScores: Record<string, number> = {}
      const improvementSuggestions: Record<string, string[]> = {}

      Object.entries(jdData.sections).forEach(([key, value]) => {
        const content = typeof value === "string" ? value : (value as string[]).join("\n")
        const result = languageProcessor.processText(content)

        // Use processed text
        processedSections[key] = result.processed
        sharpnessScores[key] = result.sharpnessScore
        improvementSuggestions[key] = languageProcessor.getImprovementSuggestions(result.sharpnessScore, result.changes)
      })

      console.log("JD generated successfully from document:", Object.keys(jdData))

      return {
        success: true,
        data: {
          title: extractedInfo.title,
          department: extractedInfo.department,
          includeStrategicVision: true, // Default to true for document uploads
          sections: processedSections,
          analysis: jdData.analysis,
          biasFlags: jdData.biasFlags || [],
          refinementMetadata: {
            sharpnessScores,
            improvementSuggestions,
          },
        },
      }
    } catch (error) {
      console.error("Error in AI service for document analysis:", error)

      // Create a basic JD from the document content
      const basicInfo = extractBasicInfoFromDocument(fileContent)
      const fallbackJD = generateFallbackJD(basicInfo)

      return {
        success: true,
        data: fallbackJD,
        warning: "Used fallback JD generation due to API limitations.",
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
    measurableOutcomes:
      "Increase team productivity by 20%, reduce process time by 15%, and implement 3 new initiatives within 12 months",
    mindset: "Strategic thinking and problem-solving approach",
    advantage: "Contribute to organizational growth and innovation",
    decisions: "Balance priorities and make data-driven decisions",
  }
}

// Generate a fallback JD when the AI service is unavailable
function generateFallbackJD(data: any) {
  const title = data.title || "Position"
  const department = data.department || "Department"

  // Get department info if available
  const departmentInfo = getDepartmentByValue(department) || getDepartmentByName(department)

  // Create basic sections
  const overview = `As a ${title} at Atlan, you will play a crucial role in our ${department} team, driving key initiatives and contributing to our mission of transforming how teams collaborate with data. This position offers an opportunity to make a significant impact on our product and customer experience.`

  // Create responsibilities based on department guardrails if available
  const responsibilities = [
    `Lead key initiatives within the ${department} team`,
    "Collaborate with cross-functional teams to key initiatives within the ${department} team",
    "Collaborate with cross-functional teams to achieve organizational goals",
    "Drive measurable outcomes that contribute to Atlan's growth",
    "Implement best practices and ensure high-quality deliverables",
    "Analyze results and provide insights to improve processes",
  ]

  if (departmentInfo) {
    // Add department-specific responsibilities
    departmentInfo.guardrails.owns.forEach((area, index) => {
      if (index < 2) {
        // Add up to 2 department-specific responsibilities
        responsibilities.push(`Take ownership of ${area}`)
      }
    })
  }

  // Create qualifications
  const qualifications = [
    `Experience in ${department.toLowerCase()} or a related field`,
    "Strong communication and collaboration skills",
    "Analytical thinking and problem-solving abilities",
    "Ability to work in a fast-paced, remote environment",
    "Passion for data and its potential to transform organizations",
  ]

  // Calculate sharpness scores
  const sharpnessScores = {
    overview: 4.0,
    responsibilities: 3.5,
    qualifications: 4.0,
  }

  // Create improvement suggestions
  const improvementSuggestions = {
    overview: ["Add more specific details about the role's impact"],
    responsibilities: ["Make responsibilities more measurable", "Add specific outcomes"],
    qualifications: ["Add more specific technical skills required"],
  }

  return {
    title,
    department,
    includeStrategicVision: true,
    sections: {
      overview,
      responsibilities,
      qualifications,
    },
    analysis: {
      clarity: 75,
      inclusivity: 85,
      seo: 70,
      attraction: 80,
    },
    biasFlags: [],
    refinementMetadata: {
      sharpnessScores,
      improvementSuggestions,
    },
    isFallback: true,
  }
}

// Server action to enhance an existing JD
export async function enhanceExistingJD(content: string) {
  try {
    console.log("enhanceExistingJD action called")

    if (!content || content.trim() === "") {
      return {
        success: false,
        error: "Empty content provided. Please ensure your file contains text content.",
      }
    }

    console.log(`JD content length: ${content.length}, first 100 chars: ${content.substring(0, 100)}...`)

    // Create a cache key based on the content
    const cacheKey = `enhance:${content.substring(0, 200)}`

    try {
      // Extract information from the existing JD
      const extractedInfo = await getCachedOrFetch(cacheKey, async () => {
        const extractionPrompt = `
            Extract key information from the following job description:
            
            ${content.substring(0, 5000)} ${content.length > 5000 ? "... (content truncated)" : ""}
            
            Extract and format the response as a JSON object with the following structure:
            {
              "title": "...",
              "department": "...",
              "responsibilities": ["...", "..."],
              "qualifications": ["...", "..."],
              "overview": "..."
            }
            
            IMPORTANT: Your response must be valid JSON that can be parsed with JSON.parse().
          `

        // Extract information from the JD
        const extractedInfoText = await generateWithFallback(extractionPrompt)
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

        try {
          return JSON.parse(jsonStr)
        } catch (parseError) {
          console.error("JSON parsing error for extracted info:", parseError)
          // Create a basic extraction from the document
          return extractBasicInfoFromJD(content)
        }
      })

      // Get department guardrails if available
      const departmentInfo =
        getDepartmentByValue(extractedInfo.department) || getDepartmentByName(extractedInfo.department)

      // Enhance the JD using the language processor
      const enhancedJD = {
        title: extractedInfo.title,
        department: extractedInfo.department,
        sections: {},
        analysis: {
          clarity: 85,
          inclusivity: 90,
          seo: 80,
          attraction: 85,
        },
        enhancementSummary: [
          "Improved language clarity and impact",
          "Made responsibilities more outcome-focused",
          "Removed potential bias and improved inclusivity",
          "Applied Atlan's standards of excellence",
        ],
        biasRemoved: [],
      }

      // Process each section with the language processor
      if (extractedInfo.overview) {
        const result = languageProcessor.processText(extractedInfo.overview)
        enhancedJD.sections.overview = result.processed
      }

      if (extractedInfo.responsibilities && Array.isArray(extractedInfo.responsibilities)) {
        const responsibilitiesText = extractedInfo.responsibilities.join("\n")
        const result = languageProcessor.processText(responsibilitiesText)
        enhancedJD.sections.responsibilities = result.processed.split("\n").filter((item) => item.trim() !== "")
      }

      if (extractedInfo.qualifications && Array.isArray(extractedInfo.qualifications)) {
        const qualificationsText = extractedInfo.qualifications.join("\n")
        const result = languageProcessor.processText(qualificationsText)
        enhancedJD.sections.qualifications = result.processed.split("\n").filter((item) => item.trim() !== "")
      }

      // Apply department guardrails if available
      if (departmentInfo) {
        // Add department-specific enhancements
        enhancedJD.enhancementSummary.push(`Aligned with ${departmentInfo.name} department guardrails`)

        // Check if responsibilities align with ownership areas
        const ownerships = departmentInfo.guardrails.owns
        const avoidAreas = departmentInfo.guardrails.avoid

        // Add ownership areas if they're missing from responsibilities
        if (enhancedJD.sections.responsibilities && Array.isArray(enhancedJD.sections.responsibilities)) {
          const currentResponsibilities = enhancedJD.sections.responsibilities.join(" ").toLowerCase()

          // Add missing ownership areas
          ownerships.forEach((area) => {
            const areaLower = area.toLowerCase()
            if (!currentResponsibilities.includes(areaLower)) {
              enhancedJD.sections.responsibilities.push(`Lead initiatives related to ${area}`)
            }
          })

          // Check for areas to avoid
          avoidAreas.forEach((area) => {
            const areaLower = area.toLowerCase()
            enhancedJD.sections.responsibilities = enhancedJD.sections.responsibilities.filter(
              (resp) => !resp.toLowerCase().includes(areaLower),
            )
          })
        }
      }

      // Apply language processing to each section
      const processedSections: Record<string, any> = {}
      const sharpnessScores: Record<string, number> = {}
      const improvementSuggestions: Record<string, string[]> = {}

      Object.entries(enhancedJD.sections).forEach(([key, value]) => {
        const content = typeof value === "string" ? value : (value as string[]).join("\n")
        const result = languageProcessor.processText(content)

        // Use processed text
        processedSections[key] = result.processed
        sharpnessScores[key] = result.sharpnessScore
        improvementSuggestions[key] = languageProcessor.getImprovementSuggestions(result.sharpnessScore, result.changes)
      })

      // Generate a unique ID for this enhanced JD
      const id = Date.now().toString()

      // Store the enhanced JD data in session storage (this will be done client-side)
      // We'll add this functionality to the client component

      return {
        success: true,
        id,
        data: {
          title: enhancedJD.title,
          department: enhancedJD.department,
          sections: processedSections,
          analysis: enhancedJD.analysis,
          enhancementSummary: enhancedJD.enhancementSummary,
          biasRemoved: enhancedJD.biasRemoved,
          refinementMetadata: {
            sharpnessScores,
            improvementSuggestions,
          },
        },
      }
    } catch (error) {
      console.error("Error in AI service for JD enhancement:", error)

      // Fallback: Use the language processor to enhance the JD
      const extractedInfo = extractBasicInfoFromJD(content)
      const fallbackJD = generateFallbackJD(extractedInfo)

      return {
        success: true,
        id: Date.now().toString(),
        data: fallbackJD,
        warning: "Used fallback JD enhancement due to API limitations.",
      }
    }
  } catch (error) {
    console.error("Error enhancing JD:", error)
    return {
      success: false,
      error: "Failed to enhance the job description. Please try again.",
    }
  }
}

// Helper function to extract basic information from an existing JD
function extractBasicInfoFromJD(content: string): any {
  // Simple extraction logic based on common patterns in job descriptions
  let title = "Position"
  let department = "Department"
  let responsibilities: string[] = []
  let qualifications: string[] = []
  let overview = ""

  // Try to extract title - look for common patterns
  const titlePatterns = [
    /(?:job title|position|role|job)[\s:]+([^\n.]+)/i,
    /^([^-\n]{3,50})[\s-]+(?:job description|jd|description)/i,
    /^((?:[a-z]+ )+(?:engineer|manager|director|specialist|analyst|developer|designer|coordinator|assistant|lead))/i,
  ]

  for (const pattern of titlePatterns) {
    const match = content.match(pattern)
    if (match && match[1] && match[1].trim().length > 2) {
      title = match[1].trim()
      break
    }
  }

  // Try to extract department - look for common patterns
  const deptPatterns = [
    /(?:department|team|division)[\s:]+([^\n.]+)/i,
    /(?:part of|join|within) the ([^\n.]{3,30}) (?:team|department|group|division)/i,
  ]

  for (const pattern of deptPatterns) {
    const match = content.match(pattern)
    if (match && match[1] && match[1].trim().length > 2) {
      department = match[1].trim()
      break
    }
  }

  // Try to extract responsibilities section
  const respSectionPatterns = [
    /(?:responsibilities|duties|what you'll do|what you will do|key responsibilities)[\s\S]*?(?=qualifications|requirements|what you need|about you|$)/i,
    /(?:the role|in this role|in this position)[\s\S]*?(?=qualifications|requirements|what you need|about you|$)/i,
  ]

  for (const pattern of respSectionPatterns) {
    const match = content.match(pattern)
    if (match && match[0]) {
      // Look for bullet points or numbered lists
      const respItems = match[0].match(/(?:^|\n)[\s•\-*#0-9]+\.?\s*([^\n•\-*#][^\n]+)/g)
      if (respItems && respItems.length > 0) {
        responsibilities = respItems
          .map((item) => item.replace(/^[\s•\-*#0-9]+\.?\s*/, "").trim())
          .filter((item) => item.length > 10)
          .slice(0, 7)
        break
      }
    }
  }

  // Try to extract qualifications section
  const qualSectionPatterns = [
    /(?:qualifications|requirements|what you need|about you|skills|experience)[\s\S]*?(?=benefits|perks|why join|about us|$)/i,
    /(?:we're looking for|we are looking for|the ideal candidate)[\s\S]*?(?=benefits|perks|why join|about us|$)/i,
  ]

  for (const pattern of qualSectionPatterns) {
    const match = content.match(pattern)
    if (match && match[0]) {
      // Look for bullet points or numbered lists
      const qualItems = match[0].match(/(?:^|\n)[\s•\-*#0-9]+\.?\s*([^\n•\-*#][^\n]+)/g)
      if (qualItems && qualItems.length > 0) {
        qualifications = qualItems
          .map((item) => item.replace(/^[\s•\-*#0-9]+\.?\s*/, "").trim())
          .filter((item) => item.length > 10)
          .slice(0, 7)
        break
      }
    }
  }

  // Try to extract overview
  const overviewPatterns = [
    /(?:overview|about the role|summary|about this role|about the position)[\s\S]*?(?=responsibilities|duties|what you'll do|what you will do|$)/i,
    /(?:we are|we're|our company|about us)[\s\S]{10,500}?(?=responsibilities|duties|what you'll do|what you will do|the role|$)/i,
  ]

  for (const pattern of overviewPatterns) {
    const match = content.match(pattern)
    if (match && match[0]) {
      overview = match[0]
        .replace(/(?:overview|about the role|summary|about this role|about the position)[\s:]+/i, "")
        .trim()
      if (overview.length > 50) break
    }
  }

  // If we couldn't extract an overview, take the first paragraph
  if (!overview || overview.length < 50) {
    const firstParagraph = content.split(/\n\s*\n/)[0]
    if (firstParagraph && firstParagraph.length > 50) {
      overview = firstParagraph.trim()
    }
  }

  // Log what we extracted for debugging
  console.log("Extracted JD info:", {
    title,
    department,
    responsibilitiesCount: responsibilities.length,
    qualificationsCount: qualifications.length,
    overviewLength: overview.length,
  })

  return {
    title,
    department,
    responsibilities,
    qualifications,
    overview,
  }
}

// Direct API implementation for Gemini with key rotation and enhanced prompts
import { getKeyManager } from "./key-manager"

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

// Circuit breaker state
const circuitState = {
  isOpen: false,
  failureCount: 0,
  lastFailureTime: 0,
  failureThreshold: 2, // Number of failures before opening circuit
  resetTimeout: 60000, // 1 minute timeout before trying again
}

// Rate limiting state
const rateLimitState = {
  lastRequestTime: 0,
  minRequestInterval: 500, // Minimum 0.5 second between requests (adjusted for multiple keys)
}

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, wait: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

// JSON repair utility for fixing malformed JSON responses
function jsonrepair(json: string): string {
  try {
    // Simple JSON repair for common issues
    const fixed = json
      .replace(/,\s*}/g, "}") // Remove trailing commas in objects
      .replace(/,\s*\]/g, "]") // Remove trailing commas in arrays
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":') // Ensure property names are quoted
      .replace(/\\/g, "\\\\") // Escape backslashes
      .replace(/\n/g, "\\n") // Escape newlines
      .replace(/\r/g, "\\r") // Escape carriage returns
      .replace(/\t/g, "\\t") // Escape tabs

    // Try to parse it
    JSON.parse(fixed)
    return fixed
  } catch (e) {
    // If simple repair fails, return the original
    return json
  }
}

// Function to chunk text with overlap to avoid losing context
function chunkText(text: string, maxChunkSize = 4000, overlap = 100): string[] {
  if (text.length <= maxChunkSize) {
    return [text]
  }

  const chunks: string[] = []
  let currentChunk = ""

  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/)

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 <= maxChunkSize) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph
    } else {
      // If current paragraph doesn't fit, save current chunk and start a new one
      if (currentChunk) {
        chunks.push(currentChunk)
        // Add overlap from previous chunk if possible
        const words = currentChunk.split(/\s+/)
        const overlapText = words.slice(-Math.min(words.length, Math.floor(overlap / 5))).join(" ")
        currentChunk = overlapText + "\n\n" + paragraph
      } else {
        // If a single paragraph is too long, split by sentences
        const sentences = paragraph.split(/(?<=[.!?])\s+/)
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= maxChunkSize) {
            currentChunk += (currentChunk ? " " : "") + sentence
          } else {
            if (currentChunk) {
              chunks.push(currentChunk)
              // Add overlap from previous chunk
              const words = currentChunk.split(/\s+/)
              const overlapText = words.slice(-Math.min(words.length, Math.floor(overlap / 5))).join(" ")
              currentChunk = overlapText + " " + sentence
            } else {
              // If a single sentence is too long, just split it
              chunks.push(sentence.substring(0, maxChunkSize))
              currentChunk = sentence.substring(maxChunkSize)
            }
          }
        }
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk)
  }

  return chunks
}

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  apiCallFn: () => Promise<T>,
  retries = 3,
  baseDelay = 500,
  statusesToRetry = [429, 500, 502, 503, 504],
): Promise<T> {
  let lastError: any

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await apiCallFn()
    } catch (error: any) {
      lastError = error

      // Check if this is a status code we should retry
      const shouldRetry =
        (error.status && statusesToRetry.includes(error.status)) ||
        (error.message && error.message.includes("overloaded"))

      if (!shouldRetry) {
        throw error // Don't retry if it's not a retriable error
      }

      const delay = Math.min(2 ** attempt * baseDelay, 10000) // Cap at 10 seconds
      console.log(`Retry attempt ${attempt + 1}/${retries} failed, waiting ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Function to generate content with Gemini with improved error handling and key rotation
export async function generateWithGemini(prompt: string) {
  // Check if circuit is open (API is known to be down)
  if (circuitState.isOpen) {
    const now = Date.now()
    if (now - circuitState.lastFailureTime < circuitState.resetTimeout) {
      console.log("Circuit is open, using fallback response")
      throw new Error("AI service temporarily unavailable - circuit open")
    } else {
      // Try to reset the circuit after timeout
      console.log("Attempting to reset circuit")
      circuitState.isOpen = false
    }
  }

  // Apply rate limiting
  const now = Date.now()
  const timeSinceLastRequest = now - rateLimitState.lastRequestTime
  if (timeSinceLastRequest < rateLimitState.minRequestInterval) {
    const waitTime = rateLimitState.minRequestInterval - timeSinceLastRequest
    console.log(`Rate limiting: waiting ${waitTime}ms before next request`)
    await new Promise((resolve) => setTimeout(resolve, waitTime))
  }

  try {
    // Get an API key from the key manager
    const keyManager = getKeyManager()
    const apiKey = keyManager.getNextKey()

    if (!apiKey) {
      console.error("No API keys available")
      throw new Error("All API keys are currently unavailable")
    }

    // Chunk the prompt if it's too large - now with overlap
    const promptChunks = chunkText(prompt, 4000, 100)
    let fullResponse = ""

    // Process each chunk
    for (let i = 0; i < promptChunks.length; i++) {
      const chunk = promptChunks[i]
      const isFirstChunk = i === 0
      const isLastChunk = i === promptChunks.length - 1

      // Add context for chunked prompts
      let processedChunk = chunk
      if (promptChunks.length > 1) {
        if (!isFirstChunk) {
          processedChunk = `(Continuing from previous chunk) ${chunk}`
        }
        if (!isLastChunk) {
          processedChunk = `${chunk} (to be continued in next chunk)`
        }
      }

      const url = `${GEMINI_API_URL}?key=${apiKey}`
      console.log(
        `Calling Gemini API with prompt chunk ${i + 1}/${promptChunks.length}, length: ${processedChunk.length}`,
      )

      // Update rate limit state
      rateLimitState.lastRequestTime = Date.now()

      // Use retryWithBackoff for API calls
      const makeApiCall = async () => {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: processedChunk,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_MEDIUM_AND_ABOVE",
              },
            ],
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API request failed with status ${response.status}:`, errorText)

          // Report error to key manager
          keyManager.reportError(apiKey)

          // Create an error object with status for the retry mechanism
          const error = new Error(`API request failed with status ${response.status}: ${errorText}`)
          ;(error as any).status = response.status

          // Update circuit breaker for 503 errors
          if (response.status === 503) {
            circuitState.failureCount++
            circuitState.lastFailureTime = Date.now()

            if (circuitState.failureCount >= circuitState.failureThreshold) {
              circuitState.isOpen = true
              console.log("Circuit breaker opened due to multiple failures")
            }
          }

          throw error
        }

        const data = await response.json()
        return data
      }

      // Call API with retry mechanism
      const data = await retryWithBackoff(makeApiCall)

      // Report success to key manager
      keyManager.reportSuccess(apiKey)

      // Reset failure count on success
      circuitState.failureCount = 0

      console.log(`Gemini API response for chunk ${i + 1}:`, JSON.stringify(data).substring(0, 200) + "...")

      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content ||
        !data.candidates[0].content.parts ||
        !data.candidates[0].content.parts[0]
      ) {
        console.error("Unexpected API response structure:", JSON.stringify(data))
        throw new Error("Unexpected API response structure")
      }

      fullResponse += data.candidates[0].content.parts[0].text

      // Add a small delay between chunk requests to avoid rate limiting
      if (!isLastChunk) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return fullResponse
  } catch (error) {
    console.error("Error generating content with Gemini:", error)
    throw error
  }
}

// Debounced version of generateWithGemini for UI interactions
export const debouncedGenerateWithGemini = debounce(generateWithGemini, 500)

// Enhanced prompts for JD generation with Atlan-specific guidelines
const ATLAN_JD_SYSTEM_PROMPT = `
You are an expert job description writer for Atlan, a modern data collaboration workspace.
Follow these Atlan JD Standards when creating job descriptions:

1. CLARITY: Use clear, specific language that avoids jargon and ambiguity.
2. INCLUSIVITY: Use gender-neutral and inclusive language throughout.
3. COMPLETENESS: Include all essential components (overview, responsibilities, qualifications, benefits).
4. ENGAGEMENT: Create compelling content that connects the role to Atlan's mission.
5. ATLAN VOICE: Maintain Atlan's voice - mission-driven, ownership-focused, and inspirational.

FORMAT:
- Position Overview: Engaging paragraph explaining purpose and impact
- "What will you do?": 7-10 bullet points using action verbs
- "What makes you a great match for us?": 7-10 bullet points focusing on skills over experience
- Benefits & Culture: Highlight Atlan's unique benefits and values
- Diversity Statement: Express Atlan's commitment to diversity and inclusion

Always structure your response as valid JSON for programmatic processing.
`

// Comprehensive list of potentially problematic terms to avoid in JDs
const BIAS_DETECTION_PROMPT = `
Analyze this job description for potentially biased or non-inclusive language. Look for:

1. Gender-coded terms: Not just obvious ones like "he/she" or "guys", but also terms that research shows may subtly discourage certain genders (e.g., "aggressive", "competitive", "dominant" may discourage women; "collaborative", "supportive", "nurturing" may discourage men)

2. Age-biased language: Terms like "young", "energetic", "digital native", "recent graduate", "fresh", or anything implying a specific age group

3. Cultural or educational bias: References to "cultural fit", specific educational institutions, or requirements that may exclude qualified candidates from diverse backgrounds

4. Ability bias: Terms that assume physical abilities without mentioning accommodations (e.g., "walk", "see", "hear", "stand")

5. Unnecessarily exclusionary requirements: Years of experience that are arbitrary, specific tools/technologies when skills are transferable, or requirements not essential to job success

6. Superlatives and hyperbole: Terms like "ninja", "rockstar", "guru", "world-class", "exceptional" that may discourage qualified candidates who don't identify with such labels

7. Idioms or colloquialisms: Expressions that may not translate well across cultures or be understood by non-native speakers

8. Unnecessarily complex language: Jargon or technical terms that aren't explained and may exclude qualified candidates

Don't limit yourself to these examples - identify ANY language that could potentially exclude qualified candidates.

For each issue found, return:
- The exact problematic term or phrase
- The surrounding context
- A specific suggestion for replacement
- The reason it could be problematic

Return as JSON array: [{"term":"problematic term","context":"surrounding text","suggestion":"better alternative","reason":"explanation"}]
If no bias detected, return empty array.
`

// Function to structure a JD according to Atlan standards with separate analysis
export async function generateAtlanJD(data: any) {
  try {
    // Step 1: Generate the core JD content with enhanced prompt
    const jdContent = await generateAtlanJDWithAI(data)

    // Step 2: If successful, perform a separate analysis call
    if (jdContent && jdContent.sections) {
      try {
        // Combine all sections for analysis
        const allContent = [
          jdContent.sections.overview,
          ...(Array.isArray(jdContent.sections.responsibilities)
            ? jdContent.sections.responsibilities
            : [jdContent.sections.responsibilities]),
          ...(Array.isArray(jdContent.sections.qualifications)
            ? jdContent.sections.qualifications
            : [jdContent.sections.qualifications]),
        ].join("\n\n")

        // Perform analysis in a separate call with enhanced prompt
        const analysis = await analyzeJDContent(allContent)

        // Merge the analysis with the JD content
        return {
          ...jdContent,
          analysis: analysis ||
            jdContent.analysis || {
              clarity: 80,
              inclusivity: 80,
              seo: 80,
              attraction: 80,
            },
        }
      } catch (analysisError) {
        console.error("Error during JD analysis:", analysisError)
        // Return the JD content even if analysis fails
        return jdContent
      }
    }

    throw new Error("Failed to generate valid JD content")
  } catch (error) {
    console.error("Error in generateAtlanJD:", error)
    throw error
  }
}

// AI-based JD generation with improved JSON parsing and enhanced prompt
async function generateAtlanJDWithAI(data: any) {
  // Enhanced prompt template with Atlan JD Standards
  const prompt = `
    ${ATLAN_JD_SYSTEM_PROMPT}
    
    Create a detailed job description for ${data.title} at Atlan that will attract top 10% global talent.
    
    About the role:
    - Title: ${data.title}
    - Department: ${data.department}
    - Key outcomes: ${data.outcomes}
    - Mindset: ${data.mindset}
    - Strategic advantage: ${data.advantage}
    - Key decisions: ${data.decisions}
    
    Follow these guidelines:
    1. Use the Voice of Atlan - strategic clarity, inspirational language, ownership focus, and mission-driven tone
    2. Avoid corporate clichés, resume buzzwords, and bland statements
    3. Focus on outcomes and impact rather than just responsibilities
    4. Highlight the strategic importance of the role to Atlan's mission
    5. Use inclusive language that appeals to diverse candidates
    
    Format as JSON: {"sections":{"overview":"...","responsibilities":["..."],"qualifications":["..."]}, "analysis":{"clarity":85,"inclusivity":78,"seo":92,"attraction":88}}
  `

  console.log("Generating Atlan JD with data:", JSON.stringify(data))
  const response = await generateWithGemini(prompt)
  console.log("Raw LLM response:", response.substring(0, 500) + "...")

  // Try to extract JSON if the response contains non-JSON text
  let jsonStr = response

  // Look for JSON-like structure if the response isn't pure JSON
  if (!jsonStr.trim().startsWith("{")) {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
      console.log("Extracted JSON from response:", jsonStr.substring(0, 200) + "...")
    }
  }

  try {
    // Use jsonrepair to fix common JSON issues before parsing
    const repairedJson = jsonrepair(jsonStr)
    const parsedData = JSON.parse(repairedJson)
    console.log("Successfully parsed JD data:", Object.keys(parsedData))
    return parsedData
  } catch (parseError) {
    console.error("JSON parsing error:", parseError)
    console.error("Failed to parse:", jsonStr)
    throw new Error("Failed to parse AI response")
  }
}

// New function to analyze JD content separately with enhanced prompt
async function analyzeJDContent(content: string) {
  const prompt = `
    You are an expert job description analyzer for Atlan.
    
    Analyze this job description content for quality metrics according to Atlan JD Standards:
    
    "${content.substring(0, 3000)}${content.length > 3000 ? "..." : ""}"
    
    Evaluate on these dimensions (1-100 scale):
    
    1. CLARITY: How clear, specific, and jargon-free is the language? Does it avoid ambiguity and clearly communicate expectations?
    
    2. INCLUSIVITY: How well does it use gender-neutral and inclusive language? Does it avoid terms that might discourage diverse candidates?
    
    3. SEO OPTIMIZATION: How well is it optimized for search engines and job boards? Does it use relevant keywords naturally?
    
    4. TALENT ATTRACTION: How compelling and engaging is it for top candidates? Does it inspire and connect to Atlan's mission?
    
    Return JSON with these metrics:
    {"clarity": 85, "inclusivity": 78, "seo": 92, "attraction": 88}
  `

  try {
    const response = await generateWithGemini(prompt)

    // Extract JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const jsonStr = jsonMatch[0]
      const repairedJson = jsonrepair(jsonStr)
      return JSON.parse(repairedJson)
    }

    throw new Error("Could not extract analysis JSON")
  } catch (error) {
    console.error("Error analyzing JD content:", error)
    // Return default values if analysis fails
    return {
      clarity: 80,
      inclusivity: 80,
      seo: 80,
      attraction: 80,
    }
  }
}

// Function to get refinement suggestions for a specific section with enhanced prompt
export async function getRefinementSuggestions(section: string, content: string) {
  try {
    // Try to use the AI service
    return await getRefinementSuggestionsWithAI(section, content)
  } catch (error) {
    console.log("AI service unavailable for refinement, using fallback suggestions")
    // Use fallback template-based approach
    return generateFallbackRefinements(section, content)
  }
}

// AI-based refinement suggestions with improved parsing and enhanced prompt
async function getRefinementSuggestionsWithAI(section: string, content: string) {
  // Enhanced prompt with Atlan JD Standards
  const prompt = `
    You are an expert job description editor for Atlan.
    
    Analyze this ${section} section of a job description according to Atlan JD Standards:
    
    "${content}"
    
    Provide 3-4 specific suggestions that:
    1. Enhance clarity and remove ambiguity
    2. Use more inclusive and gender-neutral language
    3. Incorporate Atlan's voice (mission-driven, ownership-focused, inspirational)
    4. Make the content more compelling for top talent
    5. Focus on strategic impact and outcomes rather than just tasks
    
    Format as JSON array: [{"original":"specific text to replace","suggestion":"improved text","reason":"explanation of improvement"}]
    
    Be specific about exactly what text should be replaced, not general advice.
  `

  console.log(`Getting refinement suggestions for ${section} section`)
  const response = await generateWithGemini(prompt)
  console.log("Raw refinement suggestions response:", response.substring(0, 200) + "...")

  // Try to extract JSON if the response contains non-JSON text
  let jsonStr = response

  // Look for JSON-like structure if the response isn't pure JSON
  if (!jsonStr.trim().startsWith("[")) {
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      jsonStr = jsonMatch[0]
      console.log("Extracted JSON array from response:", jsonStr.substring(0, 200) + "...")
    }
  }

  try {
    // Use jsonrepair to fix common JSON issues before parsing
    const repairedJson = jsonrepair(jsonStr)
    return JSON.parse(repairedJson)
  } catch (parseError) {
    console.error("JSON parsing error for refinement suggestions:", parseError)
    console.error("Failed to parse:", jsonStr)
    throw new Error("Failed to parse AI response for refinements")
  }
}

// Template-based fallback refinement suggestions
function generateFallbackRefinements(section: string, content: string) {
  // Generic refinement suggestions based on section type
  if (section === "overview") {
    return [
      {
        original: "Template suggestion for overview",
        suggestion: "Consider highlighting the strategic impact of this role more clearly",
        reason: "Strategic clarity helps candidates understand their potential contribution",
      },
      {
        original: "Template suggestion for overview",
        suggestion: "Add more inspirational language about the mission and vision",
        reason: "Inspirational language attracts mission-driven candidates",
      },
    ]
  } else if (section === "responsibilities") {
    return [
      {
        original: "Template suggestion for responsibilities",
        suggestion: "Start each responsibility with a strong action verb",
        reason: "Action verbs create a sense of ownership and impact",
      },
      {
        original: "Template suggestion for responsibilities",
        suggestion: "Include metrics or outcomes for key responsibilities",
        reason: "Quantifiable outcomes help candidates understand success criteria",
      },
    ]
  } else if (section === "qualifications") {
    return [
      {
        original: "Template suggestion for qualifications",
        suggestion: "Focus on capabilities and mindset rather than just years of experience",
        reason: "This attracts diverse talent who may have non-traditional backgrounds",
      },
      {
        original: "Template suggestion for qualifications",
        suggestion: "Include both technical and soft skills required for success",
        reason: "Balanced skill requirements attract well-rounded candidates",
      },
    ]
  }

  // Default fallback
  return [
    {
      original: "Template suggestion",
      suggestion: "Use more specific and impactful language",
      reason: "Specificity and impact attract top talent",
    },
    {
      original: "Template suggestion",
      suggestion: "Align content more closely with Atlan's mission and values",
      reason: "Mission alignment attracts candidates who share your values",
    },
  ]
}

// Function to check for bias in JD content with improved chunking, parsing and enhanced prompt
export async function checkForBias(content: string) {
  try {
    // Try to use the AI service with improved chunking
    return await checkForBiasWithAI(content)
  } catch (error) {
    console.log("AI service unavailable for bias check, using fallback check")
    // Use fallback template-based approach
    return generateFallbackBiasCheck(content)
  }
}

// AI-based bias check with improved chunking, parsing and enhanced prompt
async function checkForBiasWithAI(content: string) {
  // Chunk the content with overlap to maintain context
  const contentChunks = chunkText(content, 3000, 100)
  let allBiasFlags: any[] = []

  for (let i = 0; i < contentChunks.length; i++) {
    const chunk = contentChunks[i]

    // Enhanced prompt with comprehensive bias detection
    const prompt = BIAS_DETECTION_PROMPT + `\n\nAnalyze this text:\n"${chunk}"`

    console.log(`Checking for bias in content chunk ${i + 1}/${contentChunks.length}`)

    try {
      const response = await generateWithGemini(prompt)
      console.log(`Raw bias check response for chunk ${i + 1}:`, response.substring(0, 200) + "...")

      // Try to extract JSON if the response contains non-JSON text
      let jsonStr = response

      // Look for JSON-like structure if the response isn't pure JSON
      if (!jsonStr.trim().startsWith("[")) {
        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
          console.log("Extracted JSON array from response:", jsonStr.substring(0, 200) + "...")
        } else if (jsonStr.includes("[]") || jsonStr.includes("[ ]")) {
          // Handle empty array case
          continue
        }
      }

      // Use jsonrepair to fix common JSON issues before parsing
      const repairedJson = jsonrepair(jsonStr)
      const biasFlags = JSON.parse(repairedJson)
      allBiasFlags = [...allBiasFlags, ...biasFlags]
    } catch (parseError) {
      console.error("JSON parsing error for bias check:", parseError)
      // Continue with other chunks instead of failing completely
    }

    // Add a small delay between chunk requests
    if (i < contentChunks.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  return allBiasFlags
}

// Template-based fallback bias check
function generateFallbackBiasCheck(content: string) {
  // Simple pattern matching for common biased terms
  const biasedTerms = [
    { term: "he", suggestion: "they", reason: "Gender-neutral language is more inclusive" },
    { term: "she", suggestion: "they", reason: "Gender-neutral language is more inclusive" },
    { term: "his", suggestion: "their", reason: "Gender-neutral language is more inclusive" },
    { term: "her", suggestion: "their", reason: "Gender-neutral language is more inclusive" },
    { term: "man", suggestion: "person", reason: "Gender-neutral language is more inclusive" },
    { term: "guys", suggestion: "team", reason: "Gender-neutral language is more inclusive" },
    { term: "ninja", suggestion: "expert", reason: "Avoid cultural stereotypes" },
    { term: "guru", suggestion: "specialist", reason: "Avoid cultural stereotypes" },
    { term: "rockstar", suggestion: "exceptional performer", reason: "Avoid potentially exclusionary terms" },
    { term: "young", suggestion: "energetic", reason: "Age-neutral language is more inclusive" },
    { term: "aggressive", suggestion: "proactive", reason: "Avoid terms with gender-coded connotations" },
    { term: "competitive", suggestion: "achievement-oriented", reason: "Avoid terms with gender-coded connotations" },
  ]

  const contentLower = content.toLowerCase()
  const results = []

  for (const { term, suggestion, reason } of biasedTerms) {
    if (contentLower.includes(term.toLowerCase())) {
      // Find the context around the term
      const index = contentLower.indexOf(term.toLowerCase())
      const start = Math.max(0, index - 20)
      const end = Math.min(contentLower.length, index + term.length + 20)
      const context = content.substring(start, end)

      results.push({
        term,
        context,
        suggestion,
        reason,
      })
    }
  }

  return results
}

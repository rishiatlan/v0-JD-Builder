// Direct API implementation for Gemini
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
  minRequestInterval: 1000, // Minimum 1 second between requests
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

// Function to chunk text to avoid overloading the model
function chunkText(text: string, maxChunkSize = 4000): string[] {
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
        currentChunk = paragraph
      } else {
        // If a single paragraph is too long, split by sentences
        const sentences = paragraph.split(/(?<=[.!?])\s+/)
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length + 1 <= maxChunkSize) {
            currentChunk += (currentChunk ? " " : "") + sentence
          } else {
            chunks.push(currentChunk)
            currentChunk = sentence
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

// Function to generate content with Gemini with circuit breaker pattern
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
    // Replace GEMINI_API_KEY with the actual environment variable
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not set")
      throw new Error("API key not configured")
    }

    // Chunk the prompt if it's too large
    const promptChunks = chunkText(prompt, 4000)
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

      // Use native fetch instead of importing https
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
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API request failed with status ${response.status}:`, errorText)

        // If the model is overloaded (503), update circuit breaker
        if (response.status === 503) {
          circuitState.failureCount++
          circuitState.lastFailureTime = Date.now()

          if (circuitState.failureCount >= circuitState.failureThreshold) {
            circuitState.isOpen = true
            console.log("Circuit breaker opened due to multiple failures")
          }

          throw new Error("AI service is currently overloaded")
        }

        throw new Error(`API request failed with status ${response.status}: ${errorText}`)
      }

      // Reset failure count on success
      circuitState.failureCount = 0

      const data = await response.json()
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

// Function to structure a JD according to Atlan standards
export async function generateAtlanJD(data: any) {
  // Always use the AI service, no fallbacks
  return await generateAtlanJDWithAI(data)
}

// AI-based JD generation
async function generateAtlanJDWithAI(data: any) {
  const prompt = `
    Create a detailed, production-ready job description for the role of ${data.title} at Atlan following the Atlan Standard of Excellence.
    
    About the role:
    - Title: ${data.title}
    - Department: ${data.department}
    - Key outcomes that define success: ${data.outcomes}
    - Mindset/instincts of top performers: ${data.mindset}
    - Strategic advantage this role provides: ${data.advantage}
    - Key decisions/trade-offs in this role: ${data.decisions}
    
    The JD should follow Atlan's approved framework with these sections:
    1. Position Overview - A detailed paragraph explaining the role's purpose, impact, and where it fits in the organization
    2. "What will you do?" - 7-10 specific, detailed bullet points of key responsibilities that clearly outline day-to-day work and strategic contributions
    3. "What makes you a great match for us?" - 7-10 specific, detailed bullet points of qualifications, experience, and traits required for success
    
    Voice and Tone Guidelines:
    - Strategic clarity with specific details about the role's impact
    - Inspirational language that connects to Atlan's mission
    - Focus on ownership and high-leverage behaviors with concrete examples
    - Mission-driven and excellence-first voice
    - Avoid corporate clichés and bland statements
    - Attract globally elite, mission-driven candidates with compelling language
    
    Format the response as a JSON object with the following structure:
    {
      "sections": {
        "overview": "...",
        "responsibilities": ["...", "...", "..."],
        "qualifications": ["...", "...", "..."]
      },
      "analysis": {
        "clarity": 85,
        "inclusivity": 78,
        "seo": 92,
        "attraction": 88
      },
      "suggestions": [
        {
          "section": "overview",
          "original": "...",
          "suggestion": "...",
          "reason": "..."
        }
      ],
      "biasFlags": [
        {
          "term": "...",
          "context": "...",
          "suggestion": "...",
          "reason": "..."
        }
      ]
    }
    
    Ensure the content is bias-free, inclusive, and optimized to attract top 10% global talent.
    Make sure each responsibility and qualification is specific, detailed, and tailored to the role.
    
    IMPORTANT: 
    - AVOID phrases like "X years of experience" or "minimum Y years" in qualifications
    - Instead, describe skills and achievements with language like "proven experience," "track record," or outcome-based accomplishments
    - Frame qualifications based on impact and capabilities, not tenure
    - Include specific technical skills and concrete examples where appropriate
    - Use phrases like "demonstrated ability to..." or "experience successfully..." instead of time-based requirements
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
    // Parse the JSON response
    const parsedData = JSON.parse(jsonStr)
    console.log("Successfully parsed JD data:", Object.keys(parsedData))
    return parsedData
  } catch (parseError) {
    console.error("JSON parsing error:", parseError)
    console.error("Failed to parse:", jsonStr)
    throw new Error("Failed to parse AI response")
  }
}

// Template-based fallback JD generation
// function generateFallbackJD(data: any) {
//   // Create a template-based JD using the provided data
//   const overview = `As a ${data.title} in the ${data.department} department at Atlan, you will play a crucial role in ${data.outcomes}. This position requires someone with ${data.mindset}, who can navigate complex decisions related to ${data.decisions} while contributing to ${data.advantage}.`

//   // Generate responsibilities based on the role
//   const responsibilities = [
//     `Drive key outcomes including ${data.outcomes}`,
//     `Demonstrate and embody the mindset of ${data.mindset}`,
//     `Make strategic decisions regarding ${data.decisions}`,
//     `Contribute to Atlan's competitive advantage through ${data.advantage}`,
//     `Collaborate with cross-functional teams to achieve department goals`,
//     `Continuously improve processes and methodologies within your domain`,
//   ]

//   // Generate qualifications based on the role
//   const qualifications = [
//     `Proven experience in ${data.department} or related field`,
//     `Strong understanding of ${data.outcomes.split(" ").slice(0, 3).join(" ")}`,
//     `Demonstrated ability to ${data.mindset.split(" ").slice(0, 3).join(" ")}`,
//     `Experience making decisions related to ${data.decisions.split(" ").slice(0, 3).join(" ")}`,
//     `Excellent communication and collaboration skills`,
//     `Passion for Atlan's mission and values`,
//   ]

//   return {
//     sections: {
//       overview,
//       responsibilities,
//       qualifications,
//     },
//     analysis: {
//       clarity: 80,
//       inclusivity: 85,
//       seo: 75,
//       attraction: 80,
//     },
//     suggestions: [
//       {
//         section: "overview",
//         original: "This is a template-generated overview.",
//         suggestion: "Consider adding more specific details about the role's impact.",
//         reason: "More specificity will attract better candidates.",
//       },
//     ],
//     biasFlags: [],
//     isTemplateFallback: true, // Flag to indicate this was generated by the template
//   }
// }

// Function to get refinement suggestions for a specific section
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

// AI-based refinement suggestions
async function getRefinementSuggestionsWithAI(section: string, content: string) {
  const prompt = `
    Analyze the following ${section} section of a job description for Atlan and provide refinement suggestions:
    
    "${content}"
    
    Provide suggestions that:
    1. Enhance strategic clarity
    2. Use more inspirational language
    3. Focus on ownership and high-leverage behaviors
    4. Align with Atlan's mission-driven and excellence-first voice
    5. Remove any corporate clichés or bland statements
    6. Make it more attractive to globally elite, mission-driven candidates
    
    Format the response as a JSON array with the following structure:
    [
      {
        "original": "...",
        "suggestion": "...",
        "reason": "..."
      }
    ]
    
    Provide 2-3 high-impact suggestions that would significantly improve the content.
    
    IMPORTANT: Your response must be valid JSON that can be parsed with JSON.parse().
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
    // Parse the JSON response
    return JSON.parse(jsonStr)
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

// Function to check for bias in JD content
export async function checkForBias(content: string) {
  try {
    // Try to use the AI service
    return await checkForBiasWithAI(content)
  } catch (error) {
    console.log("AI service unavailable for bias check, using fallback check")
    // Use fallback template-based approach
    return generateFallbackBiasCheck(content)
  }
}

// AI-based bias check
async function checkForBiasWithAI(content: string) {
  // Chunk the content to avoid overloading the model
  const contentChunks = chunkText(content, 3000)
  let allBiasFlags: any[] = []

  for (let i = 0; i < contentChunks.length; i++) {
    const chunk = contentChunks[i]

    const prompt = `
    Analyze the following job description content for potential bias, non-inclusive language, or exclusionary terms:
    
    "${chunk}"
    
    Identify any gender-coded, exclusionary, or non-inclusive terms, with special attention to:
    1. Gender-coded language (he/she, him/her, etc.)
    2. Years of experience requirements (e.g., "5+ years experience", "minimum 3 years", etc.)
    3. Exclusionary terms or phrases that might discourage diverse candidates
    
    Format the response as a JSON array with the following structure:
    [
      {
        "term": "...",
        "context": "...",
        "suggestion": "...",
        "reason": "..."
      }
    ]
    
    For years of experience requirements, suggest alternatives like:
    - "Proven experience in..."
    - "Demonstrated ability to..."
    - "Track record of..."
    - "History of successfully..."
    
    If no bias is detected, return an empty array.
    
    IMPORTANT: Your response must be valid JSON that can be parsed with JSON.parse().
  `

    console.log(`Checking for bias in content chunk ${i + 1}/${contentChunks.length}`)
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

    try {
      // Parse the JSON response
      const biasFlags = JSON.parse(jsonStr)
      allBiasFlags = [...allBiasFlags, ...biasFlags]
    } catch (parseError) {
      console.error("JSON parsing error for bias check:", parseError)
      console.error("Failed to parse:", jsonStr)
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
    {
      term: "years of experience",
      suggestion: "proven experience",
      reason: "Years-based criteria may exclude qualified candidates with non-linear backgrounds",
    },
    {
      term: "years experience",
      suggestion: "demonstrated ability",
      reason: "Years-based criteria may exclude qualified candidates with non-linear backgrounds",
    },
    {
      term: "minimum years",
      suggestion: "track record of",
      reason: "Years-based criteria may exclude qualified candidates with non-linear backgrounds",
    },
    {
      term: "at least N years",
      suggestion: "history of successfully",
      reason: "Years-based criteria may exclude qualified candidates with non-linear backgrounds",
    },
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

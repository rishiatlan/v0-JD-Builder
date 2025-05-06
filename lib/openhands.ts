// OpenHands library implementation
// Connects to the Gemini API for AI-powered JD generation and enhancement

export async function generateWithGemini(prompt: string): Promise<string> {
  try {
    // Use the environment variable for the API key
    const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_2 || process.env.GEMINI_API_KEY_3

    if (!apiKey) {
      throw new Error("Gemini API key not found in environment variables")
    }

    // Call the Gemini API directly using fetch with the correct model: gemini-2.0-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          },
        }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Gemini API error:", errorData)
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Extract the text from the response
    let text = ""
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      text = data.candidates[0].content.parts.map((part: any) => part.text).join("")
    }

    return text
  } catch (error) {
    console.error("Error generating with Gemini:", error)
    throw new Error("Failed to generate content with Gemini API")
  }
}

// Add a fallback mechanism to handle API failures
export async function generateWithFallback(prompt: string): Promise<string> {
  try {
    return await generateWithGemini(prompt)
  } catch (error) {
    console.error("Gemini API failed, using fallback:", error)
    // Return a basic response that indicates we're using a fallback
    return JSON.stringify({
      fallback: true,
      message: "Generated using fallback mechanism due to API limitations",
      timestamp: new Date().toISOString(),
    })
  }
}

export async function generateAtlanJD(data: any): Promise<any> {
  try {
    // Construct a prompt that includes department guardrails if available
    let guardrailsPrompt = ""
    if (data.departmentGuardrails) {
      guardrailsPrompt = `
      IMPORTANT ROLE BOUNDARY GUARDRAILS:
      This is a ${data.department} role. Please ensure the job description follows these guardrails:
      
      OWNERSHIP AREAS (include these responsibilities):
      ${data.departmentGuardrails.owns}
      
      AREAS TO AVOID (do not include these responsibilities):
      ${data.departmentGuardrails.avoid}
      `
    }

    const prompt = `
      Create a comprehensive job description for the following role:
      
      Title: ${data.title}
      Department: ${data.department}
      
      Key Outcomes: ${data.outcomes}
      Measurable Outcomes: ${data.measurableOutcomes || "Not specified"}
      Mindset/Instincts: ${data.mindset}
      Strategic Advantage: ${data.advantage}
      Key Decisions/Trade-offs: ${data.decisions}
      
      ${guardrailsPrompt}
      
      Format the response as a JSON object with the following structure:
      {
        "sections": {
          "overview": "A compelling paragraph that summarizes the role, its impact, and why it matters",
          "responsibilities": ["Responsibility 1", "Responsibility 2", ...],
          "qualifications": ["Qualification 1", "Qualification 2", ...]
        },
        "analysis": {
          "clarity": 0-100 score,
          "inclusivity": 0-100 score,
          "seo": 0-100 score,
          "attraction": 0-100 score
        },
        "biasFlags": [
          {"text": "potentially biased text", "reason": "explanation of bias", "suggestion": "alternative text"}
        ]
      }
      
      IMPORTANT GUIDELINES:
      1. Make the overview compelling and outcome-focused
      2. List 5-7 key responsibilities that align with the department's ownership areas
      3. List 5-7 qualifications that would make someone successful
      4. Ensure language is inclusive and free of bias
      5. Focus on measurable outcomes rather than tasks
      6. Use active voice and strong action verbs
      7. Avoid jargon and buzzwords
      8. Keep the tone professional but conversational
      9. STRICTLY FOLLOW THE ROLE BOUNDARY GUARDRAILS
      
      Your response must be valid JSON that can be parsed with JSON.parse().
    `

    try {
      const response = await generateWithFallback(prompt)

      // Extract JSON from the response
      let jsonStr = response
      if (!jsonStr.trim().startsWith("{")) {
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        } else {
          throw new Error("Failed to extract valid JSON from the response")
        }
      }

      return JSON.parse(jsonStr)
    } catch (error) {
      console.error("Error parsing Gemini response:", error)
      // Return a basic fallback JD structure
      return {
        sections: {
          overview: `As a ${data.title} at Atlan, you will drive key outcomes related to ${data.outcomes}. This role requires a ${data.mindset} mindset and will contribute to ${data.advantage}.`,
          responsibilities: [
            `Lead initiatives to achieve ${data.outcomes}`,
            `Make decisions regarding ${data.decisions}`,
            "Collaborate with cross-functional teams",
            "Drive measurable results",
            "Implement best practices",
          ],
          qualifications: [
            `Experience with ${data.department} or related field`,
            "Strong communication skills",
            "Problem-solving abilities",
            "Collaborative mindset",
            "Data-driven approach",
          ],
        },
        analysis: {
          clarity: 80,
          inclusivity: 90,
          seo: 75,
          attraction: 85,
        },
        biasFlags: [],
      }
    }
  } catch (error) {
    console.error("Error generating JD:", error)
    throw new Error("Failed to generate job description")
  }
}

export async function getRefinementSuggestions(
  section: string,
  content: string,
  refinedSegments: string[] = [],
): Promise<any[]> {
  try {
    // Create a prompt that includes already refined segments to avoid duplicate suggestions
    let refinedSegmentsPrompt = ""
    if (refinedSegments.length > 0) {
      refinedSegmentsPrompt = `
      ALREADY REFINED SEGMENTS (do not suggest changes for these):
      ${refinedSegments.join("\n")}
      `
    }

    const prompt = `
      Analyze the following ${section} section of a job description and provide 3 specific suggestions to improve it.
      
      SECTION CONTENT:
      ${content}
      
      ${refinedSegmentsPrompt}
      
      For each suggestion:
      1. Identify a specific phrase or sentence that could be improved
      2. Provide a better alternative
      3. Explain why your suggestion is better
      
      Format your response as a JSON array:
      [
        {
          "original": "text to be replaced",
          "suggestion": "improved text",
          "reason": "explanation of why this is better"
        },
        ...
      ]
      
      IMPROVEMENT GUIDELINES:
      - Make language more outcome-focused rather than task-focused
      - Replace vague statements with specific, measurable outcomes
      - Convert passive voice to active voice
      - Remove unnecessary jargon or buzzwords
      - Ensure language is inclusive and bias-free
      - Improve clarity and conciseness
      - Add specificity where statements are too general
      
      Your response must be valid JSON that can be parsed with JSON.parse().
    `

    try {
      const response = await generateWithFallback(prompt)

      // Extract JSON from the response
      let jsonStr = response
      if (!jsonStr.trim().startsWith("[")) {
        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        } else {
          throw new Error("Failed to extract valid JSON from the response")
        }
      }

      return JSON.parse(jsonStr)
    } catch (error) {
      console.error("Error parsing refinement suggestions:", error)
      // Return basic fallback suggestions using the language processor
      return [
        {
          original: "responsible for",
          suggestion: "lead",
          reason: "Using active voice creates stronger impact and clarity",
        },
        {
          original: "help with",
          suggestion: "drive",
          reason: "More outcome-focused language shows ownership and impact",
        },
        {
          original: "world-class",
          suggestion: "high-performing",
          reason: "More specific and measurable than vague superlatives",
        },
      ]
    }
  } catch (error) {
    console.error("Error getting refinement suggestions:", error)
    return []
  }
}

export async function checkForBias(content: string): Promise<any[]> {
  try {
    const prompt = `
      Analyze the following job description for potential bias or non-inclusive language.
      
      JOB DESCRIPTION:
      ${content}
      
      Identify any words, phrases, or statements that might:
      1. Contain gender bias
      2. Show age discrimination
      3. Include cultural or racial bias
      4. Have ableist language
      5. Contain unnecessary jargon that limits the applicant pool
      6. Use exclusionary terms
      
      For each issue found, provide:
      1. The exact text that contains bias
      2. An explanation of why it's problematic
      3. A suggested alternative
      
      Format your response as a JSON array:
      [
        {
          "text": "biased text",
          "issue": "type of bias",
          "explanation": "why it's problematic",
          "suggestion": "alternative text"
        },
        ...
      ]
      
      If no bias is found, return an empty array.
      Your response must be valid JSON that can be parsed with JSON.parse().
    `

    try {
      const response = await generateWithFallback(prompt)

      // Extract JSON from the response
      let jsonStr = response
      if (!jsonStr.trim().startsWith("[")) {
        const jsonMatch = response.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          jsonStr = jsonMatch[0]
        } else {
          return []
        }
      }

      return JSON.parse(jsonStr)
    } catch (error) {
      console.error("Error parsing bias check:", error)
      return []
    }
  } catch (error) {
    console.error("Error checking for bias:", error)
    return []
  }
}

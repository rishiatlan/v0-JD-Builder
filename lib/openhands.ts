// Direct API implementation for Gemini
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

// Function to generate content with Gemini
export async function generateWithGemini(prompt: string) {
  try {
    // Replace GEMINI_API_KEY with the actual environment variable
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      console.error("GEMINI_API_KEY environment variable is not set")
      throw new Error("API key not configured")
    }

    const url = `${GEMINI_API_URL}?key=${apiKey}`
    console.log("Calling Gemini API with prompt:", prompt.substring(0, 100) + "...")

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
                text: prompt,
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
      throw new Error(`API request failed with status ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log("Gemini API response:", JSON.stringify(data).substring(0, 200) + "...")

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

    return data.candidates[0].content.parts[0].text
  } catch (error) {
    console.error("Error generating content with Gemini:", error)
    throw error
  }
}

// Function to structure a JD according to Atlan standards
export async function generateAtlanJD(data: any) {
  const prompt = `
    Create a job description for the role of ${data.title} at Atlan following the Atlan Standard of Excellence.
    
    About the role:
    - Title: ${data.title}
    - Department: ${data.department}
    - Key outcomes that define success: ${data.outcomes}
    - Mindset/instincts of top performers: ${data.mindset}
    - Strategic advantage this role provides: ${data.advantage}
    - Key decisions/trade-offs in this role: ${data.decisions}
    
    The JD should follow Atlan's approved framework with these sections:
    1. Position Overview - A concise paragraph explaining the role's purpose and impact
    2. "What will you do?" - 5-8 bullet points of key responsibilities
    3. "What makes you a great match for us?" - 5-8 bullet points of qualifications and traits
    
    Voice and Tone Guidelines:
    - Strategic clarity
    - Inspirational language
    - Focus on ownership and high-leverage behaviors
    - Mission-driven and excellence-first voice
    - Avoid corporate clichés and bland statements
    - Attract globally elite, mission-driven candidates
    
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
    
    IMPORTANT: Your response must be valid JSON that can be parsed with JSON.parse().
  `

  try {
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

      // Fallback: Return a basic structure with error information
      return {
        sections: {
          overview: "There was an error generating the job description. Please try again.",
          responsibilities: ["Please try again with more specific information."],
          qualifications: ["Please try again with more specific information."],
        },
        analysis: {
          clarity: 0,
          inclusivity: 0,
          seo: 0,
          attraction: 0,
        },
        error: "Failed to parse LLM response as JSON",
      }
    }
  } catch (error) {
    console.error("Error generating Atlan JD:", error)
    throw error
  }
}

// Function to get refinement suggestions for a specific section
export async function getRefinementSuggestions(section: string, content: string) {
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

  try {
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

      // Return empty array as fallback
      return []
    }
  } catch (error) {
    console.error("Error generating refinement suggestions:", error)
    throw error
  }
}

// Function to check for bias in JD content
export async function checkForBias(content: string) {
  const prompt = `
    Analyze the following job description content for potential bias, non-inclusive language, or exclusionary terms:
    
    "${content}"
    
    Identify any gender-coded, exclusionary, or non-inclusive terms.
    
    Format the response as a JSON array with the following structure:
    [
      {
        "term": "...",
        "context": "...",
        "suggestion": "...",
        "reason": "..."
      }
    ]
    
    If no bias is detected, return an empty array.
    
    IMPORTANT: Your response must be valid JSON that can be parsed with JSON.parse().
  `

  try {
    console.log("Checking for bias in content")
    const response = await generateWithGemini(prompt)
    console.log("Raw bias check response:", response.substring(0, 200) + "...")

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
        return []
      }
    }

    try {
      // Parse the JSON response
      return JSON.parse(jsonStr)
    } catch (parseError) {
      console.error("JSON parsing error for bias check:", parseError)
      console.error("Failed to parse:", jsonStr)

      // Return empty array as fallback
      return []
    }
  } catch (error) {
    console.error("Error checking for bias:", error)
    throw error
  }
}

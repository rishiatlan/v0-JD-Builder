// Text sanitizer to remove years of experience requirements

const bannedPatterns = [
  /\d+\+?\s*years?\s+(?:of\s+)?experience/gi,
  /at least \d+\s*years/gi,
  /minimum of \d+\s*years/gi,
  /\d+\+?\s*years?\s+in\s+/gi,
  /experience of \d+\+?\s*years/gi,
  /\d+\+?\s*years?\s+(?:of\s+)?background/gi,
]

const replacements = [
  "proven experience",
  "demonstrated ability",
  "track record",
  "experience successfully",
  "history of delivering",
  "proven capability",
]

/**
 * Removes years of experience requirements from text and replaces with capability-based language
 */
export function removeYearsOfExperience(text: string): string {
  if (!text) return text

  let cleanedText = text
  let replacementIndex = 0

  for (const pattern of bannedPatterns) {
    if (pattern.test(cleanedText)) {
      // Rotate through replacement phrases
      const replacement = replacements[replacementIndex % replacements.length]
      replacementIndex++

      // Replace the pattern
      cleanedText = cleanedText.replace(pattern, replacement)
    }
  }

  return cleanedText
}

/**
 * Sanitizes an entire JD object to remove years of experience requirements
 */
export function sanitizeJD(jdData: any): any {
  if (!jdData || !jdData.sections) return jdData

  const sanitizedJD = { ...jdData }

  // Sanitize overview
  if (sanitizedJD.sections.overview) {
    sanitizedJD.sections.overview = removeYearsOfExperience(sanitizedJD.sections.overview)
  }

  // Sanitize responsibilities
  if (Array.isArray(sanitizedJD.sections.responsibilities)) {
    sanitizedJD.sections.responsibilities = sanitizedJD.sections.responsibilities.map(removeYearsOfExperience)
  } else if (typeof sanitizedJD.sections.responsibilities === "string") {
    sanitizedJD.sections.responsibilities = removeYearsOfExperience(sanitizedJD.sections.responsibilities)
  }

  // Sanitize qualifications
  if (Array.isArray(sanitizedJD.sections.qualifications)) {
    sanitizedJD.sections.qualifications = sanitizedJD.sections.qualifications.map(removeYearsOfExperience)
  } else if (typeof sanitizedJD.sections.qualifications === "string") {
    sanitizedJD.sections.qualifications = removeYearsOfExperience(sanitizedJD.sections.qualifications)
  }

  return sanitizedJD
}

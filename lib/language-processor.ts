// Language post-processor for JD enhancement

interface ProcessorOptions {
  removeRedundancy?: boolean
  enhanceLanguage?: boolean
  convertPassiveToActive?: boolean
  removeIntensifiers?: boolean
}

interface ProcessingResult {
  original: string
  processed: string
  changes: Change[]
  sharpnessScore: number
}

interface Change {
  type: "redundancy" | "grandiose" | "passive" | "vague" | "intensifier"
  original: string
  replacement: string
  reason: string
}

export class LanguageProcessor {
  // Grandiose words that should be replaced with sharper alternatives
  private grandioseWords: Record<string, string> = {
    "world-class": "high-performing",
    cornerstone: "key component",
    "cutting-edge": "advanced",
    "best-in-class": "leading",
    "game-changing": "innovative",
    revolutionary: "innovative",
    groundbreaking: "innovative",
    "state-of-the-art": "modern",
    "next-generation": "advanced",
    "bleeding-edge": "advanced",
    "paradigm-shifting": "transformative",
    disruptive: "transformative",
    unparalleled: "exceptional",
    unrivaled: "exceptional",
    unmatched: "exceptional",
    "best-of-breed": "top-tier",
    visionary: "forward-thinking",
    synergistic: "collaborative",
    holistic: "comprehensive",
    robust: "strong",
    seamless: "smooth",
    frictionless: "smooth",
    leverage: "use",
    utilize: "use",
    empower: "enable",
    champion: "advocate for",
    drive: "lead",
    spearhead: "lead",
    architect: "design",
    evangelize: "promote",
  }

  // Passive voice patterns to convert to active voice
  private passivePatterns: Record<string, string> = {
    "responsible for": "own and lead",
    "in charge of": "lead",
    "tasked with": "drive",
    "assigned to": "own",
    "will be required to": "will",
    "is expected to": "will",
    "duties include": "will",
    "will need to": "will",
  }

  // Vague impact language to replace with specific outcomes
  private vagueImpactPatterns: Record<string, string> = {
    "make an impact": "deliver measurable results",
    "drive success": "achieve specific outcomes",
    "contribute to growth": "increase [specific metric]",
    "help the team": "collaborate with the team to achieve",
    "support the business": "enable business goals by",
    "improve processes": "optimize processes to reduce [time/cost]",
    "enhance performance": "improve performance by [specific metric]",
  }

  // Intensifiers that can be removed
  private intensifiers: string[] = [
    "very",
    "really",
    "extremely",
    "deeply",
    "highly",
    "greatly",
    "incredibly",
    "remarkably",
    "substantially",
    "significantly",
    "extensively",
  ]

  // Redundant phrase patterns
  private redundantPatterns: string[][] = [
    ["scalable and built for scale", "scalable"],
    ["innovative and creative", "innovative"],
    ["collaborate and work together", "collaborate"],
    ["plan and strategize", "strategize"],
    ["monitor and track", "monitor"],
    ["analyze and evaluate", "analyze"],
    ["develop and create", "develop"],
    ["implement and execute", "implement"],
    ["manage and oversee", "manage"],
    ["communicate and convey", "communicate"],
    ["design and architect", "design"],
    ["lead and guide", "lead"],
    ["optimize and improve", "optimize"],
    ["review and assess", "review"],
  ]

  /**
   * Process text to enhance language quality
   */
  public processText(text: string, options: ProcessorOptions = {}): ProcessingResult {
    const changes: Change[] = []
    let processedText = text

    // Apply language enhancements
    if (options.enhanceLanguage !== false) {
      const grandioseChanges = this.replaceGrandioseWords(processedText)
      changes.push(...grandioseChanges.changes)
      processedText = grandioseChanges.text

      const vagueChanges = this.replaceVagueImpact(processedText)
      changes.push(...vagueChanges.changes)
      processedText = vagueChanges.text
    }

    // Convert passive to active voice
    if (options.convertPassiveToActive !== false) {
      const passiveChanges = this.convertPassiveToActive(processedText)
      changes.push(...passiveChanges.changes)
      processedText = passiveChanges.text
    }

    // Remove intensifiers
    if (options.removeIntensifiers !== false) {
      const intensifierChanges = this.removeIntensifiers(processedText)
      changes.push(...intensifierChanges.changes)
      processedText = intensifierChanges.text
    }

    // Remove redundancy
    if (options.removeRedundancy !== false) {
      const redundancyChanges = this.removeRedundancy(processedText)
      changes.push(...redundancyChanges.changes)
      processedText = redundancyChanges.text
    }

    // Calculate sharpness score
    const sharpnessScore = this.calculateSharpnessScore(text, processedText, changes)

    return {
      original: text,
      processed: processedText,
      changes,
      sharpnessScore,
    }
  }

  /**
   * Replace grandiose words with sharper alternatives
   */
  private replaceGrandioseWords(text: string): { text: string; changes: Change[] } {
    const changes: Change[] = []
    let processedText = text

    Object.entries(this.grandioseWords).forEach(([grandiose, sharp]) => {
      const regex = new RegExp(`\\b${grandiose}\\b`, "gi")
      if (regex.test(processedText)) {
        changes.push({
          type: "grandiose",
          original: grandiose,
          replacement: sharp,
          reason: `Replaced grandiose term "${grandiose}" with sharper alternative "${sharp}"`,
        })
        processedText = processedText.replace(regex, sharp)
      }
    })

    return { text: processedText, changes }
  }

  /**
   * Convert passive voice to active voice
   */
  private convertPassiveToActive(text: string): { text: string; changes: Change[] } {
    const changes: Change[] = []
    let processedText = text

    Object.entries(this.passivePatterns).forEach(([passive, active]) => {
      const regex = new RegExp(`\\b${passive}\\b`, "gi")
      if (regex.test(processedText)) {
        changes.push({
          type: "passive",
          original: passive,
          replacement: active,
          reason: `Converted passive phrase "${passive}" to active "${active}"`,
        })
        processedText = processedText.replace(regex, active)
      }
    })

    return { text: processedText, changes }
  }

  /**
   * Replace vague impact language with specific outcomes
   */
  private replaceVagueImpact(text: string): { text: string; changes: Change[] } {
    const changes: Change[] = []
    let processedText = text

    Object.entries(this.vagueImpactPatterns).forEach(([vague, specific]) => {
      const regex = new RegExp(`\\b${vague}\\b`, "gi")
      if (regex.test(processedText)) {
        changes.push({
          type: "vague",
          original: vague,
          replacement: specific,
          reason: `Replaced vague impact "${vague}" with more specific "${specific}"`,
        })
        processedText = processedText.replace(regex, specific)
      }
    })

    return { text: processedText, changes }
  }

  /**
   * Remove unnecessary intensifiers
   */
  private removeIntensifiers(text: string): { text: string; changes: Change[] } {
    const changes: Change[] = []
    let processedText = text

    this.intensifiers.forEach((intensifier) => {
      const regex = new RegExp(`\\b${intensifier}\\b\\s`, "gi")
      if (regex.test(processedText)) {
        changes.push({
          type: "intensifier",
          original: intensifier,
          replacement: "",
          reason: `Removed unnecessary intensifier "${intensifier}"`,
        })
        processedText = processedText.replace(regex, "")
      }
    })

    return { text: processedText, changes }
  }

  /**
   * Remove redundant phrases
   */
  private removeRedundancy(text: string): { text: string; changes: Change[] } {
    const changes: Change[] = []
    let processedText = text

    this.redundantPatterns.forEach(([redundant, concise]) => {
      const regex = new RegExp(`\\b${redundant}\\b`, "gi")
      if (regex.test(processedText)) {
        changes.push({
          type: "redundancy",
          original: redundant,
          replacement: concise,
          reason: `Simplified redundant phrase "${redundant}" to "${concise}"`,
        })
        processedText = processedText.replace(regex, concise)
      }
    })

    return { text: processedText, changes }
  }

  /**
   * Calculate sharpness score based on changes made
   */
  private calculateSharpnessScore(original: string, processed: string, changes: Change[]): number {
    // Base score starts at 3
    let score = 3

    // If no changes needed, it's already sharp
    if (changes.length === 0) {
      return 5
    }

    // Calculate improvement percentage
    const originalWords = original.split(/\s+/).length
    const processedWords = processed.split(/\s+/).length
    const conciseness = processedWords / originalWords

    // More concise text gets a higher score
    if (conciseness < 0.85) {
      score += 1
    } else if (conciseness > 0.95) {
      score -= 0.5
    }

    // Penalize for high number of changes needed
    const changeRatio = changes.length / (originalWords / 20) // Normalize by text length
    if (changeRatio > 1) {
      score -= 1
    } else if (changeRatio < 0.5) {
      score += 0.5
    }

    // Bonus for removing grandiose language
    const grandioseChanges = changes.filter((c) => c.type === "grandiose").length
    if (grandioseChanges > 0) {
      score += 0.5
    }

    // Bonus for active voice
    const passiveChanges = changes.filter((c) => c.type === "passive").length
    if (passiveChanges > 0) {
      score += 0.5
    }

    // Cap score between 1 and 5
    return Math.max(1, Math.min(5, Math.round(score * 2) / 2))
  }

  /**
   * Get improvement suggestions based on sharpness score and changes
   */
  public getImprovementSuggestions(score: number, changes: Change[]): string[] {
    const suggestions: string[] = []

    if (score < 5) {
      // Group changes by type
      const changesByType: Record<string, number> = {}
      changes.forEach((change) => {
        changesByType[change.type] = (changesByType[change.type] || 0) + 1
      })

      if (changesByType["grandiose"] > 0) {
        suggestions.push("Replace grandiose language with more precise terms")
      }

      if (changesByType["passive"] > 0) {
        suggestions.push("Convert passive voice to active voice for stronger impact")
      }

      if (changesByType["vague"] > 0) {
        suggestions.push("Replace vague impact statements with specific outcomes")
      }

      if (changesByType["redundancy"] > 0) {
        suggestions.push("Remove redundant phrases to improve conciseness")
      }

      if (changesByType["intensifier"] > 0) {
        suggestions.push("Remove unnecessary intensifiers for clearer communication")
      }

      // Add general suggestions based on score
      if (score <= 2) {
        suggestions.push("Consider rewriting for clarity and precision")
      } else if (score <= 3) {
        suggestions.push("Focus on making outcomes more measurable")
      } else if (score <= 4) {
        suggestions.push("Fine-tune language for maximum impact")
      }
    }

    return suggestions
  }

  /**
   * Generate HTML with highlighted changes
   */
  public generateDiffHtml(original: string, changes: Change[]): string {
    let html = original

    // Sort changes by position in the text (to avoid issues with overlapping replacements)
    const sortedChanges = [...changes].sort((a, b) => {
      const posA = html.toLowerCase().indexOf(a.original.toLowerCase())
      const posB = html.toLowerCase().indexOf(b.original.toLowerCase())
      return posA - posB
    })

    // Apply changes one by one
    sortedChanges.forEach((change) => {
      const regex = new RegExp(`\\b${change.original}\\b`, "gi")
      html = html.replace(
        regex,
        `<span class="diff-old">${change.original}</span><span class="diff-new">${change.replacement}</span>`,
      )
    })

    return html
  }
}

// Export singleton instance
export const languageProcessor = new LanguageProcessor()

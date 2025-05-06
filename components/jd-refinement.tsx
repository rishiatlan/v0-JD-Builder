"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import debounce from "lodash.debounce"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, RefreshCw, Loader2, Info, Star, Sparkles } from "lucide-react"
import { getSectionRefinements } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import { languageProcessor } from "@/lib/language-processor"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface JDRefinementProps {
  data: any
  onComplete: (refinedData: any) => void
  isLoading?: boolean
}

// Interface for tracking applied suggestions
interface AppliedSuggestion {
  section: string
  original: string
  suggestion: string
  appliedAt: number // timestamp
  textSnapshot: string // snapshot of text after applying
}

// Interface for tracking refined text segments
interface RefinedSegment {
  section: string
  text: string
  appliedAt: number
}

export function JDRefinement({
  data,
  onComplete,
  isLoading = false,
}: {
  data: any
  onComplete: (data: any) => void
  isLoading?: boolean
}) {
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [sections, setSections] = useState(data.sections)
  const [suggestions, setSuggestions] = useState(data.suggestions || [])
  const [appliedSuggestions, setAppliedSuggestions] = useState<AppliedSuggestion[]>([])
  const [refinedSegments, setRefinedSegments] = useState<RefinedSegment[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showBeforeAfter, setShowBeforeAfter] = useState(false)
  const [applyAtlanStandard, setApplyAtlanStandard] = useState(true)
  const [sharpnessScores, setSharpnessScores] = useState<Record<string, number>>({})
  const [improvementSuggestions, setImprovementSuggestions] = useState<Record<string, string[]>>({})
  const [processingResults, setProcessingResults] = useState<Record<string, any>>({})
  const { toast } = useToast()

  // Store original text for comparison
  const originalTextRef = useRef<Record<string, string>>({})

  // Initialize original text on first render
  useEffect(() => {
    const originals: Record<string, string> = {}
    Object.entries(sections).forEach(([key, value]) => {
      if (typeof value === "string") {
        originals[key] = value
      } else if (Array.isArray(value)) {
        originals[key] = value.join("\n")
      }
    })
    originalTextRef.current = originals

    // Process initial text with language processor
    if (applyAtlanStandard) {
      processAllSections()
    }
  }, [])

  // Debounced function for processing text when Atlan Standard toggle changes
  const debouncedProcessRef = useRef<any>(null)

  // Process text when Atlan Standard toggle changes
  useEffect(() => {
    // Cancel any pending debounced calls
    if (debouncedProcessRef.current) {
      debouncedProcessRef.current.cancel()
    }

    // Create a new debounced function
    debouncedProcessRef.current = debounce(() => {
      if (applyAtlanStandard) {
        processAllSections()
      } else {
        // Restore original text
        setSections(data.sections)
      }
    }, 300)

    // Call the debounced function
    debouncedProcessRef.current()

    // Cleanup
    return () => {
      if (debouncedProcessRef.current) {
        debouncedProcessRef.current.cancel()
      }
    }
  }, [applyAtlanStandard])

  const processAllSections = () => {
    const newScores: Record<string, number> = {}
    const newSuggestions: Record<string, string[]> = {}
    const newResults: Record<string, any> = {}

    Object.entries(sections).forEach(([key, value]) => {
      const content = typeof value === "string" ? value : value.join("\n")
      const result = languageProcessor.processText(content)

      newScores[key] = result.sharpnessScore
      newSuggestions[key] = languageProcessor.getImprovementSuggestions(result.sharpnessScore, result.changes)
      newResults[key] = result

      // Apply processed text if Atlan Standard is enabled
      if (applyAtlanStandard) {
        setSections((prev) => ({
          ...prev,
          [key]: result.processed,
        }))
      }
    })

    setSharpnessScores(newScores)
    setImprovementSuggestions(newSuggestions)
    setProcessingResults(newResults)
  }

  const handleSectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSections((prev) => ({ ...prev, [name]: value }))

    // Process the updated text
    if (applyAtlanStandard) {
      const result = languageProcessor.processText(value)

      setSharpnessScores((prev) => ({
        ...prev,
        [name]: result.sharpnessScore,
      }))

      setImprovementSuggestions((prev) => ({
        ...prev,
        [name]: languageProcessor.getImprovementSuggestions(result.sharpnessScore, result.changes),
      }))

      setProcessingResults((prev) => ({
        ...prev,
        [name]: result,
      }))
    }
  }

  const handleApplySuggestion = (suggestion: any) => {
    // Get current text for the section
    const currentText =
      typeof sections[suggestion.section] === "string"
        ? sections[suggestion.section]
        : sections[suggestion.section].join("\n")

    // Apply the suggestion
    const updatedText = currentText.replace(suggestion.original, suggestion.suggestion)

    // Update the sections state
    setSections((prev) => ({
      ...prev,
      [suggestion.section]: updatedText,
    }))

    // Record this applied suggestion with timestamp and text snapshot
    const newAppliedSuggestion: AppliedSuggestion = {
      section: suggestion.section,
      original: suggestion.original,
      suggestion: suggestion.suggestion,
      appliedAt: Date.now(),
      textSnapshot: updatedText,
    }

    setAppliedSuggestions((prev) => [...prev, newAppliedSuggestion])

    // Track the refined segment
    const newRefinedSegment: RefinedSegment = {
      section: suggestion.section,
      text: suggestion.suggestion,
      appliedAt: Date.now(),
    }

    setRefinedSegments((prev) => [...prev, newRefinedSegment])

    // Process the updated text
    if (applyAtlanStandard) {
      const result = languageProcessor.processText(updatedText)

      setSharpnessScores((prev) => ({
        ...prev,
        [suggestion.section]: result.sharpnessScore,
      }))

      setImprovementSuggestions((prev) => ({
        ...prev,
        [suggestion.section]: languageProcessor.getImprovementSuggestions(result.sharpnessScore, result.changes),
      }))

      setProcessingResults((prev) => ({
        ...prev,
        [suggestion.section]: result,
      }))
    }

    // Show success toast
    toast({
      title: "Suggestion Applied",
      description: "The text has been updated with the suggestion.",
      variant: "default",
    })
  }

  const handleFinalize = () => {
    // Provide immediate visual feedback
    const button = document.querySelector('button:contains("Finalize JD")')
    if (button) {
      button.classList.add("animate-pulse")
    }

    // Call the onComplete callback with the current state
    onComplete({
      title: data.title,
      department: data.department,
      sections: {
        ...sections,
      },
      // Include metadata about applied suggestions and language processing
      refinementMetadata: {
        appliedSuggestions,
        refinedSegments,
        lastModified: Date.now(),
        sharpnessScores,
        improvementSuggestions,
      },
    })
  }

  const getSectionSuggestions = (section: string) => {
    return suggestions.filter((s: any) => s.section === section)
  }

  const isSuggestionApplied = (suggestion: any) => {
    return appliedSuggestions.some(
      (s) =>
        s.section === suggestion.section &&
        s.original === suggestion.original &&
        s.suggestion === suggestion.suggestion,
    )
  }

  const fetchSuggestions = async () => {
    if (isLoadingSuggestions) return

    setIsLoadingSuggestions(true)
    try {
      const content = typeof sections[activeTab] === "string" ? sections[activeTab] : sections[activeTab].join("\n")

      // Get already refined segments for this section
      const sectionRefinedSegments = refinedSegments.filter((s) => s.section === activeTab).map((s) => s.text)

      const result = await getSectionRefinements(
        activeTab,
        content,
        sectionRefinedSegments, // Pass already refined segments to the server
      )

      if (result.success) {
        // Format the suggestions to include the section
        const formattedSuggestions = result.suggestions.map((s: any) => ({
          ...s,
          section: activeTab,
        }))

        // Filter out suggestions that are too similar to already applied ones
        const filteredSuggestions = formattedSuggestions.filter((newSuggestion) => {
          // Check if this suggestion is too similar to an already applied one
          return !appliedSuggestions.some((applied) => {
            // If it's for the same section and the original text is similar
            if (applied.section === newSuggestion.section) {
              // Check for text similarity (simple contains check)
              return (
                applied.original.includes(newSuggestion.original) ||
                newSuggestion.original.includes(applied.original) ||
                // Also check if the suggestion is similar
                applied.suggestion.includes(newSuggestion.suggestion) ||
                newSuggestion.suggestion.includes(applied.suggestion)
              )
            }
            return false
          })
        })

        // Add new suggestions to existing ones
        setSuggestions((prev) => [...prev.filter((s: any) => s.section !== activeTab), ...filteredSuggestions])

        // If we filtered out all suggestions, show a message
        if (formattedSuggestions.length > 0 && filteredSuggestions.length === 0) {
          toast({
            title: "No New Suggestions",
            description: "All potential improvements for this section have already been applied.",
            variant: "default",
          })
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to get refinement suggestions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while getting suggestions",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  // When tab changes, fetch suggestions if none exist for that section
  useEffect(() => {
    const existingSuggestions = getSectionSuggestions(activeTab)
    if (existingSuggestions.length === 0) {
      fetchSuggestions()
    }
  }, [activeTab])

  // Calculate how much the text has been refined
  const getRefinementProgress = (section: string) => {
    const sectionAppliedSuggestions = appliedSuggestions.filter((s) => s.section === section)
    if (sectionAppliedSuggestions.length === 0) return 0

    // Simple metric: number of applied suggestions
    return Math.min(100, sectionAppliedSuggestions.length * 25) // 25% per suggestion, max 100%
  }

  // Render stars for sharpness score
  const renderSharpnessStars = (score: number) => {
    const fullStars = Math.floor(score)
    const halfStar = score % 1 >= 0.5
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0)

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        ))}
        {halfStar && <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 fill-[50%]" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4 text-slate-300" />
        ))}
        <span className="ml-2 text-sm font-medium">{score.toFixed(1)}</span>
      </div>
    )
  }

  // Render before/after comparison
  const renderBeforeAfter = (section: string) => {
    if (!processingResults[section]) return null

    const result = processingResults[section]
    const diffHtml = languageProcessor.generateDiffHtml(result.original, result.changes)

    return (
      <div className="mt-4 border border-slate-200 rounded-md p-4 bg-slate-50">
        <h4 className="font-medium mb-2">Atlan Standard of Excellence Changes:</h4>
        <div className="space-y-2">
          <div className="text-sm">
            <div
              dangerouslySetInnerHTML={{
                __html: diffHtml
                  .replace(/<span class="diff-old">/g, '<span class="line-through text-red-500">')
                  .replace(/<span class="diff-new">/g, '<span class="font-bold text-green-600">'),
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Debounced switch handlers
  const handleAtlanStandardChange = useCallback((checked: boolean) => {
    setApplyAtlanStandard(checked)
  }, [])

  const handleBeforeAfterChange = useCallback((checked: boolean) => {
    setShowBeforeAfter(checked)
  }, [])

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-atlan-primary">Refine Your Job Description</CardTitle>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch id="atlan-standard" checked={applyAtlanStandard} onCheckedChange={handleAtlanStandardChange} />
              <Label htmlFor="atlan-standard" className="text-sm">
                Apply Atlan Standard of Excellence
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="before-after" checked={showBeforeAfter} onCheckedChange={handleBeforeAfterChange} />
              <Label htmlFor="before-after" className="text-sm">
                Show Changes
              </Label>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              Position Overview
              {getRefinementProgress("overview") > 0 && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                  {getRefinementProgress("overview")}%
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="responsibilities"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              What will you do?
              {getRefinementProgress("responsibilities") > 0 && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                  {getRefinementProgress("responsibilities")}%
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="qualifications"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              Great Match
              {getRefinementProgress("qualifications") > 0 && (
                <span className="ml-2 text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                  {getRefinementProgress("qualifications")}%
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4">
              {sharpnessScores.overview && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="font-medium text-sm">Sharpness Score:</span>
                  </div>
                  {renderSharpnessStars(sharpnessScores.overview)}
                </div>
              )}

              {improvementSuggestions.overview && improvementSuggestions.overview.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-1">Improvement Suggestions:</h4>
                  <ul className="list-disc pl-5 text-sm text-blue-700">
                    {improvementSuggestions.overview.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Textarea
                name="overview"
                value={sections.overview}
                onChange={handleSectionChange}
                rows={5}
                className="font-medium"
              />

              {showBeforeAfter && applyAtlanStandard && renderBeforeAfter("overview")}

              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">AI-Powered Suggestions</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchSuggestions}
                  disabled={isLoadingSuggestions}
                  className="text-atlan-primary border-atlan-primary hover:bg-atlan-primary/10"
                >
                  {isLoadingSuggestions ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>

              {appliedSuggestions.filter((s) => s.section === "overview").length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-700">
                      {appliedSuggestions.filter((s) => s.section === "overview").length} suggestion(s) already applied
                      to this section.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">New suggestions will avoid previously refined text.</p>
                  </div>
                </div>
              )}

              {isLoadingSuggestions ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
                </div>
              ) : getSectionSuggestions("overview").length > 0 ? (
                getSectionSuggestions("overview").map((suggestion: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-start">
                      <RefreshCw className="h-5 w-5 text-atlan-primary mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Suggested improvement:</p>
                        <div className="mt-2 p-2 bg-red-50 border-l-2 border-red-300 text-sm">
                          <span className="text-xs text-red-500 font-medium">Original:</span>
                          <p className="mt-1">{suggestion.original}</p>
                        </div>
                        <div className="mt-2 p-2 bg-green-50 border-l-2 border-green-300 text-sm">
                          <span className="text-xs text-green-500 font-medium">Suggestion:</span>
                          <p className="mt-1 italic">{suggestion.suggestion}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Reason: {suggestion.reason}</p>
                        <div className="mt-3 flex items-center justify-end space-x-2">
                          {isSuggestionApplied(suggestion) ? (
                            <div className="flex items-center text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Applied
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleApplySuggestion(suggestion)}
                              className="bg-atlan-primary hover:bg-atlan-primary-dark"
                            >
                              Apply Suggestion
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-center">
                  <p className="text-sm text-slate-500">
                    No suggestions available. Click "Refresh" to get AI-powered suggestions.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="responsibilities">
            <div className="space-y-4">
              {sharpnessScores.responsibilities && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="font-medium text-sm">Sharpness Score:</span>
                  </div>
                  {renderSharpnessStars(sharpnessScores.responsibilities)}
                </div>
              )}

              {improvementSuggestions.responsibilities && improvementSuggestions.responsibilities.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-1">Improvement Suggestions:</h4>
                  <ul className="list-disc pl-5 text-sm text-blue-700">
                    {improvementSuggestions.responsibilities.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                {typeof sections.responsibilities === "string" ? (
                  <Textarea
                    name="responsibilities"
                    value={sections.responsibilities}
                    onChange={handleSectionChange}
                    rows={8}
                  />
                ) : (
                  sections.responsibilities.map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="w-6 flex-shrink-0 text-center">•</div>
                      <Textarea
                        name={`responsibilities-${index}`}
                        value={item}
                        onChange={(e) => {
                          const newResponsibilities = [...sections.responsibilities]
                          newResponsibilities[index] = e.target.value
                          setSections((prev) => ({ ...prev, responsibilities: newResponsibilities }))
                        }}
                        className="flex-1"
                      />
                    </div>
                  ))
                )}
              </div>

              {showBeforeAfter && applyAtlanStandard && renderBeforeAfter("responsibilities")}

              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">AI-Powered Suggestions</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchSuggestions}
                  disabled={isLoadingSuggestions}
                  className="text-atlan-primary border-atlan-primary hover:bg-atlan-primary/10"
                >
                  {isLoadingSuggestions ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>

              {appliedSuggestions.filter((s) => s.section === "responsibilities").length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-700">
                      {appliedSuggestions.filter((s) => s.section === "responsibilities").length} suggestion(s) already
                      applied to this section.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">New suggestions will avoid previously refined text.</p>
                  </div>
                </div>
              )}

              {isLoadingSuggestions ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
                </div>
              ) : getSectionSuggestions("responsibilities").length > 0 ? (
                getSectionSuggestions("responsibilities").map((suggestion: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-start">
                      <RefreshCw className="h-5 w-5 text-atlan-primary mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Suggested improvement:</p>
                        <div className="mt-2 p-2 bg-red-50 border-l-2 border-red-300 text-sm">
                          <span className="text-xs text-red-500 font-medium">Original:</span>
                          <p className="mt-1">{suggestion.original}</p>
                        </div>
                        <div className="mt-2 p-2 bg-green-50 border-l-2 border-green-300 text-sm">
                          <span className="text-xs text-green-500 font-medium">Suggestion:</span>
                          <p className="mt-1 italic">{suggestion.suggestion}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Reason: {suggestion.reason}</p>
                        <div className="mt-3 flex items-center justify-end space-x-2">
                          {isSuggestionApplied(suggestion) ? (
                            <div className="flex items-center text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Applied
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleApplySuggestion(suggestion)}
                              className="bg-atlan-primary hover:bg-atlan-primary-dark"
                            >
                              Apply Suggestion
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-center">
                  <p className="text-sm text-slate-500">
                    No suggestions available. Click "Refresh" to get AI-powered suggestions.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="qualifications">
            <div className="space-y-4">
              {sharpnessScores.qualifications && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Sparkles className="h-5 w-5 text-yellow-500 mr-2" />
                    <span className="font-medium text-sm">Sharpness Score:</span>
                  </div>
                  {renderSharpnessStars(sharpnessScores.qualifications)}
                </div>
              )}

              {improvementSuggestions.qualifications && improvementSuggestions.qualifications.length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-medium text-blue-800 mb-1">Improvement Suggestions:</h4>
                  <ul className="list-disc pl-5 text-sm text-blue-700">
                    {improvementSuggestions.qualifications.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                {typeof sections.qualifications === "string" ? (
                  <Textarea
                    name="qualifications"
                    value={sections.qualifications}
                    onChange={handleSectionChange}
                    rows={8}
                  />
                ) : (
                  sections.qualifications.map((item: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="w-6 flex-shrink-0 text-center">•</div>
                      <Textarea
                        name={`qualifications-${index}`}
                        value={item}
                        onChange={(e) => {
                          const newQualifications = [...sections.qualifications]
                          newQualifications[index] = e.target.value
                          setSections((prev) => ({ ...prev, qualifications: newQualifications }))
                        }}
                        className="flex-1"
                      />
                    </div>
                  ))
                )}
              </div>

              {showBeforeAfter && applyAtlanStandard && renderBeforeAfter("qualifications")}

              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">AI-Powered Suggestions</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchSuggestions}
                  disabled={isLoadingSuggestions}
                  className="text-atlan-primary border-atlan-primary hover:bg-atlan-primary/10"
                >
                  {isLoadingSuggestions ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-3 w-3" />
                      Refresh
                    </>
                  )}
                </Button>
              </div>

              {appliedSuggestions.filter((s) => s.section === "qualifications").length > 0 && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-700">
                      {appliedSuggestions.filter((s) => s.section === "qualifications").length} suggestion(s) already
                      applied to this section.
                    </p>
                    <p className="text-xs text-blue-600 mt-1">New suggestions will avoid previously refined text.</p>
                  </div>
                </div>
              )}

              {isLoadingSuggestions ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
                </div>
              ) : getSectionSuggestions("qualifications").length > 0 ? (
                getSectionSuggestions("qualifications").map((suggestion: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-start">
                      <RefreshCw className="h-5 w-5 text-atlan-primary mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Suggested improvement:</p>
                        <div className="mt-2 p-2 bg-red-50 border-l-2 border-red-300 text-sm">
                          <span className="text-xs text-red-500 font-medium">Original:</span>
                          <p className="mt-1">{suggestion.original}</p>
                        </div>
                        <div className="mt-2 p-2 bg-green-50 border-l-2 border-green-300 text-sm">
                          <span className="text-xs text-green-500 font-medium">Suggestion:</span>
                          <p className="mt-1 italic">{suggestion.suggestion}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Reason: {suggestion.reason}</p>
                        <div className="mt-3 flex items-center justify-end space-x-2">
                          {isSuggestionApplied(suggestion) ? (
                            <div className="flex items-center text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Applied
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => {
                                // Prepare final data with all refinements
                                const finalData = {
                                  ...data,
                                  // Include any additional refinements or changes
                                  finalizedAt: new Date().toISOString(),
                                }

                                // Call the onComplete function with the finalized data
                                onComplete(finalData)
                              }}
                              className="bg-atlan-primary hover:bg-atlan-primary-dark"
                            >
                              Apply Suggestion
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-md text-center">
                  <p className="text-sm text-slate-500">
                    No suggestions available. Click "Refresh" to get AI-powered suggestions.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => {
              // Prepare final data with all refinements
              const finalData = {
                ...data,
                sections: {
                  ...sections,
                },
                // Include any additional refinements or changes
                finalizedAt: new Date().toISOString(),
                refinementMetadata: {
                  appliedSuggestions,
                  refinedSegments,
                  lastModified: Date.now(),
                  sharpnessScores,
                  improvementSuggestions,
                },
              }

              // Call the onComplete function with the finalized data
              onComplete(finalData)
            }}
            className="bg-atlan-primary hover:bg-atlan-primary-dark text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-pulse mr-2">⚡</span>
                Finalizing...
              </>
            ) : (
              "Finalize JD"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, RefreshCw, Loader2, AlertTriangle, Info } from "lucide-react"
import { getSectionRefinements } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
// Add import for the InclusiveLanguageExamples component
import { InclusiveLanguageExamples } from "@/components/inclusive-language-examples"

// Add this at the top of the file if it doesn't exist
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

interface JDRefinementProps {
  data: any
  onComplete: (refinedData: any) => void
  isLoading?: boolean
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
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [jdScore, setJdScore] = useState({
    overview: calculateSectionScore(activeTab),
    responsibilities: calculateSectionScore("responsibilities"),
    qualifications: calculateSectionScore("qualifications"),
  })
  const { toast } = useToast()

  // Calculate a section score based on applied suggestions
  function calculateSectionScore(section: string) {
    const sectionSuggestions = suggestions.filter((s: any) => s.section === section)
    if (sectionSuggestions.length === 0) return 100 // Perfect score if no suggestions

    const appliedCount = sectionSuggestions.filter((s: any) =>
      appliedSuggestions.includes(`${s.section}-${s.original}`),
    ).length

    return Math.min(100, Math.round(70 + (appliedCount / sectionSuggestions.length) * 30))
  }

  // Add this near the top of the component, after the useState declarations
  const [debouncedSectionContent, setDebouncedSectionContent] = useState(
    typeof sections[activeTab] === "string"
      ? sections[activeTab]
      : Array.isArray(sections[activeTab])
        ? sections[activeTab].join("\n")
        : "",
  )

  const lastContentRef = useRef("")

  useEffect(() => {
    setDebouncedSectionContent(
      typeof sections[activeTab] === "string"
        ? sections[activeTab]
        : Array.isArray(sections[activeTab])
          ? sections[activeTab].join("\n")
          : "",
    )
  }, [sections, activeTab])

  const handleSectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSections((prev) => ({ ...prev, [name]: value }))

    // Reset score when content changes significantly
    setJdScore((prev) => ({
      ...prev,
      [name]: 70, // Base score for edited content
    }))
  }

  const handleApplySuggestion = (suggestion: any) => {
    setSections((prev) => ({
      ...prev,
      [suggestion.section]:
        typeof prev[suggestion.section] === "string"
          ? prev[suggestion.section].replace(suggestion.original, suggestion.suggestion)
          : prev[suggestion.section],
    }))
    setAppliedSuggestions((prev) => [...prev, `${suggestion.section}-${suggestion.original}`])

    // Update score when suggestion is applied
    setJdScore((prev) => ({
      ...prev,
      [suggestion.section]: calculateSectionScore(suggestion.section),
    }))

    toast({
      title: "Suggestion applied",
      description: "Your job description has been improved!",
      variant: "success",
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
      scores: jdScore,
    })
  }

  const getSectionSuggestions = (section: string) => {
    return suggestions.filter((s: any) => s.section === section)
  }

  const isSuggestionApplied = (suggestion: any) => {
    return appliedSuggestions.includes(`${suggestion.section}-${suggestion.original}`)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500"
    if (score >= 75) return "text-amber-500"
    return "text-red-500"
  }

  const fetchSuggestions = async () => {
    if (isLoadingSuggestions) return

    setIsLoadingSuggestions(true)
    try {
      const content = typeof sections[activeTab] === "string" ? sections[activeTab] : sections[activeTab].join("\n")

      // Add a loading toast to improve UX
      toast({
        title: "Generating suggestions",
        description: "AI is analyzing your content...",
      })

      const result = await getSectionRefinements(activeTab, content)

      if (result.success) {
        // Format the suggestions to include the section
        const formattedSuggestions = result.suggestions.map((s: any) => ({
          ...s,
          section: activeTab,
        }))

        // Add new suggestions to existing ones
        setSuggestions((prev) => [...prev.filter((s: any) => s.section !== activeTab), ...formattedSuggestions])

        // Update score based on new suggestions
        setJdScore((prev) => ({
          ...prev,
          [activeTab]: calculateSectionScore(activeTab),
        }))

        toast({
          title: "Suggestions ready",
          description: `${formattedSuggestions.length} suggestions generated for ${activeTab} section`,
        })
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

  // Add this useEffect to trigger suggestion fetching when content changes significantly
  useEffect(() => {
    // Only fetch new suggestions if the content has changed significantly (more than 50 characters)
    const existingSuggestions = getSectionSuggestions(activeTab)
    const currentContent = debouncedSectionContent

    // Store the last content we fetched suggestions for

    if (
      existingSuggestions.length === 0 ||
      (currentContent && lastContentRef.current && Math.abs(currentContent.length - lastContentRef.current.length) > 50)
    ) {
      lastContentRef.current = currentContent
      fetchSuggestions()
    }
  }, [debouncedSectionContent])

  // Add this near the end of the component, before the final return statement
  const renderInclusiveLanguageExamples = () => {
    return (
      <div className="mt-6">
        <InclusiveLanguageExamples />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-atlan-primary flex items-center justify-between">
          <span>Refine Your Job Description</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-normal">Overall Quality:</span>
            <span
              className={`text-sm font-bold ${getScoreColor(
                (jdScore.overview + jdScore.responsibilities + jdScore.qualifications) / 3,
              )}`}
            >
              {Math.round((jdScore.overview + jdScore.responsibilities + jdScore.qualifications) / 3)}%
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Based on Atlan JD Standards compliance</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              <div className="flex items-center">
                <span>Position Overview</span>
                <span className={`ml-2 text-xs font-bold ${getScoreColor(jdScore.overview)}`}>{jdScore.overview}%</span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="responsibilities"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              <div className="flex items-center">
                <span>What will you do?</span>
                <span className={`ml-2 text-xs font-bold ${getScoreColor(jdScore.responsibilities)}`}>
                  {jdScore.responsibilities}%
                </span>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="qualifications"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              <div className="flex items-center">
                <span>Great Match</span>
                <span className={`ml-2 text-xs font-bold ${getScoreColor(jdScore.qualifications)}`}>
                  {jdScore.qualifications}%
                </span>
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Position Overview Tips</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Start with an engaging overview that captures the essence of the role and why it matters at Atlan.
                      Connect the position to our mission of helping teams do their best work with data.
                    </p>
                  </div>
                </div>
              </div>

              <Textarea
                name="overview"
                value={sections.overview}
                onChange={handleSectionChange}
                rows={5}
                className="font-medium"
              />

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

              {isLoadingSuggestions ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
                </div>
              ) : (
                getSectionSuggestions("overview").map((suggestion: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-start">
                      <RefreshCw className="h-5 w-5 text-atlan-primary mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Suggested improvement:</p>
                        <p className="text-sm mt-1 italic">{suggestion.suggestion}</p>
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
              )}
            </div>
          </TabsContent>

          <TabsContent value="responsibilities">
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Responsibilities Tips</p>
                    <p className="text-sm text-slate-600 mt-1">
                      List 5-8 key responsibilities using action verbs. Focus on outcomes rather than tasks. Be specific
                      about what the person will own and accomplish.
                    </p>
                  </div>
                </div>
              </div>

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

              {isLoadingSuggestions ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
                </div>
              ) : (
                getSectionSuggestions("responsibilities").map((suggestion: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-start">
                      <RefreshCw className="h-5 w-5 text-atlan-primary mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Suggested improvement:</p>
                        <p className="text-sm mt-1 italic">{suggestion.suggestion}</p>
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
              )}
            </div>
          </TabsContent>

          <TabsContent value="qualifications">
            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-md border border-slate-200 mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Qualifications Tips</p>
                    <p className="text-sm text-slate-600 mt-1">
                      Distinguish between "must-have" and "nice-to-have" qualifications. Focus on skills and
                      competencies rather than years of experience. Include both technical and soft skills relevant to
                      the role.
                    </p>
                  </div>
                </div>
              </div>

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

              {isLoadingSuggestions ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-atlan-primary" />
                </div>
              ) : (
                getSectionSuggestions("qualifications").map((suggestion: any, index: number) => (
                  <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-md">
                    <div className="flex items-start">
                      <RefreshCw className="h-5 w-5 text-atlan-primary mt-0.5 mr-2 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Suggested improvement:</p>
                        <p className="text-sm mt-1 italic">{suggestion.suggestion}</p>
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
              )}
            </div>
          </TabsContent>
        </Tabs>

        {renderInclusiveLanguageExamples()}

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleFinalize}
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

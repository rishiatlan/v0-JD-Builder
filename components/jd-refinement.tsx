"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, RefreshCw, Loader2 } from "lucide-react"
import { getSectionRefinements } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"

interface JDRefinementProps {
  data: any
  onComplete: (refinedData: any) => void
}

export function JDRefinement({ data, onComplete }: JDRefinementProps) {
  const [activeTab, setActiveTab] = useState<string>("overview")
  const [sections, setSections] = useState(data.sections)
  const [suggestions, setSuggestions] = useState(data.suggestions || [])
  const [appliedSuggestions, setAppliedSuggestions] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const { toast } = useToast()

  const handleSectionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setSections((prev) => ({ ...prev, [name]: value }))
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
  }

  const handleComplete = () => {
    onComplete({ sections })
  }

  const getSectionSuggestions = (section: string) => {
    return suggestions.filter((s: any) => s.section === section)
  }

  const isSuggestionApplied = (suggestion: any) => {
    return appliedSuggestions.includes(`${suggestion.section}-${suggestion.original}`)
  }

  const fetchSuggestions = async () => {
    if (isLoadingSuggestions) return

    setIsLoadingSuggestions(true)
    try {
      const content = typeof sections[activeTab] === "string" ? sections[activeTab] : sections[activeTab].join("\n")

      const result = await getSectionRefinements(activeTab, content)

      if (result.success) {
        // Format the suggestions to include the section
        const formattedSuggestions = result.suggestions.map((s: any) => ({
          ...s,
          section: activeTab,
        }))

        // Add new suggestions to existing ones
        setSuggestions((prev) => [...prev.filter((s: any) => s.section !== activeTab), ...formattedSuggestions])
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-atlan-primary">Refine Your Job Description</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              Position Overview
            </TabsTrigger>
            <TabsTrigger
              value="responsibilities"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              What will you do?
            </TabsTrigger>
            <TabsTrigger
              value="qualifications"
              className="data-[state=active]:bg-atlan-primary data-[state=active]:text-white"
            >
              Great Match
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4">
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

        <div className="mt-6 flex justify-end">
          <Button onClick={handleComplete} className="bg-atlan-primary hover:bg-atlan-primary-dark">
            Finalize Job Description
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

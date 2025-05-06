"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sparkles, CheckCircle, AlertTriangle } from "lucide-react"

interface EnhancedJDSummaryProps {
  data: any
  onContinue: () => void
}

export function EnhancedJDSummary({ data, onContinue }: EnhancedJDSummaryProps) {
  return (
    <Card className="mb-8">
      <CardHeader className="bg-gradient-to-r from-atlan-primary/10 to-atlan-primary/5 border-b">
        <CardTitle className="text-xl flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-atlan-primary" />
          JD Enhancement Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Enhanced Job Description</h3>
            <p className="text-slate-600">
              We've enhanced your job description for <span className="font-medium">{data.title}</span> in the{" "}
              <span className="font-medium">{data.department}</span> department.
            </p>
          </div>

          {data.enhancementSummary && data.enhancementSummary.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                Enhancements Made
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                {data.enhancementSummary.map((enhancement: string, index: number) => (
                  <li key={index} className="text-slate-700">
                    {enhancement}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.biasRemoved && data.biasRemoved.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-600" />
                Bias Removed
              </h3>
              <ul className="list-disc pl-5 space-y-2">
                {data.biasRemoved.map((bias: string, index: number) => (
                  <li key={index} className="text-slate-700">
                    {bias}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {data.analysis && (
            <div>
              <h3 className="text-lg font-medium mb-3">Analysis</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                  <div className="text-sm text-slate-500">Clarity</div>
                  <div className="text-2xl font-bold">{data.analysis.clarity}%</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                  <div className="text-sm text-slate-500">Inclusivity</div>
                  <div className="text-2xl font-bold">{data.analysis.inclusivity}%</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                  <div className="text-sm text-slate-500">SEO</div>
                  <div className="text-2xl font-bold">{data.analysis.seo}%</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
                  <div className="text-sm text-slate-500">Attraction</div>
                  <div className="text-2xl font-bold">{data.analysis.attraction}%</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={onContinue} className="bg-atlan-primary hover:bg-atlan-primary-dark">
              Continue to Refinement
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

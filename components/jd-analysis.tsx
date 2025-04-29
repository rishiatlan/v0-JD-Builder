import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react"

interface JDAnalysisProps {
  data: any
}

export function JDAnalysis({ data }: JDAnalysisProps) {
  const { analysis, biasFlags } = data

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500"
    if (score >= 75) return "text-amber-500"
    return "text-red-500"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (score >= 75) return <AlertTriangle className="h-5 w-5 text-amber-500" />
    return <AlertCircle className="h-5 w-5 text-red-500" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-atlan-primary">JD Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Clarity & Purpose</span>
              <div className="flex items-center">
                {getScoreIcon(analysis.clarity)}
                <span className={`ml-2 font-semibold ${getScoreColor(analysis.clarity)}`}>{analysis.clarity}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Inclusivity</span>
              <div className="flex items-center">
                {getScoreIcon(analysis.inclusivity)}
                <span className={`ml-2 font-semibold ${getScoreColor(analysis.inclusivity)}`}>
                  {analysis.inclusivity}%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">SEO Optimization</span>
              <div className="flex items-center">
                {getScoreIcon(analysis.seo)}
                <span className={`ml-2 font-semibold ${getScoreColor(analysis.seo)}`}>{analysis.seo}%</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Top Talent Attraction</span>
              <div className="flex items-center">
                {getScoreIcon(analysis.attraction)}
                <span className={`ml-2 font-semibold ${getScoreColor(analysis.attraction)}`}>
                  {analysis.attraction}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {biasFlags && biasFlags.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-atlan-primary">Bias Detection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {biasFlags.map((flag: any, index: number) => (
                <div key={index} className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">
                        Potentially biased term: <span className="font-bold">{flag.term}</span>
                      </p>
                      <p className="text-sm text-slate-600 mt-1">Context: "{flag.context}"</p>
                      <p className="text-sm text-slate-600 mt-1">Suggestion: "{flag.suggestion}"</p>
                      <p className="text-xs text-slate-500 mt-2">Reason: {flag.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-atlan-primary">Atlan Voice Check</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">Strategic clarity</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">Inspirational language</span>
            </div>
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
              <span className="text-sm">Ownership focus (needs improvement)</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-sm">Mission-driven voice</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

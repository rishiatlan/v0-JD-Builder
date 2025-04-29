import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface InclusiveLanguageExample {
  nonInclusive: string
  inclusive: string
  reason: string
}

const examples: InclusiveLanguageExample[] = [
  {
    nonInclusive: "5+ years of experience building backend systems",
    inclusive: "Proven ability to design and scale backend systems in production environments",
    reason: "Focuses on capabilities rather than arbitrary time requirements",
  },
  {
    nonInclusive: "Minimum 3 years working with React",
    inclusive: "Demonstrated expertise in building complex applications with React",
    reason: "Emphasizes skill level rather than time spent",
  },
  {
    nonInclusive: "At least 2 years of management experience",
    inclusive: "Track record of successfully leading teams and driving results",
    reason: "Highlights outcomes rather than tenure",
  },
  {
    nonInclusive: "10+ years in the industry",
    inclusive: "Deep understanding of industry trends and strategic challenges",
    reason: "Focuses on knowledge depth rather than years",
  },
  {
    nonInclusive: "Young and energetic team player",
    inclusive: "Collaborative team player with a growth mindset",
    reason: "Avoids age-biased language",
  },
  {
    nonInclusive: "Strong man to lead the team",
    inclusive: "Strong leader to guide the team",
    reason: "Uses gender-neutral language",
  },
]

export function InclusiveLanguageExamples() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Inclusive Language Examples</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Using inclusive language helps attract diverse, qualified candidates who might otherwise self-select out.
          </p>

          <div className="grid grid-cols-1 gap-3">
            {examples.map((example, index) => (
              <div key={index} className="border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                <div className="flex items-start gap-2 mb-1">
                  <div className="bg-red-100 text-red-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    ❌
                  </div>
                  <p className="text-sm text-slate-700">{example.nonInclusive}</p>
                </div>
                <div className="flex items-start gap-2 mb-1">
                  <div className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <p className="text-sm text-slate-700">{example.inclusive}</p>
                </div>
                <p className="text-xs text-slate-500 ml-7">{example.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

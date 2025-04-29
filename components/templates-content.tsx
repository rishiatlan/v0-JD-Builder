"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function TemplatesContent() {
  const router = useRouter()

  const handleUseTemplate = (templateId: string) => {
    router.push(`/?template=${templateId}`)
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Data Engineer</CardTitle>
          <CardDescription>Template for Data Engineering roles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            For roles focused on building data pipelines, ETL processes, and data infrastructure.
          </p>
          <Button
            className="w-full bg-atlan-primary hover:bg-atlan-primary-dark"
            onClick={() => handleUseTemplate("data-engineer")}
          >
            Use Template
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Data Analyst</CardTitle>
          <CardDescription>Template for Data Analysis roles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            For roles focused on analyzing data, creating visualizations, and deriving insights.
          </p>
          <Button
            className="w-full bg-atlan-primary hover:bg-atlan-primary-dark"
            onClick={() => handleUseTemplate("data-analyst")}
          >
            Use Template
          </Button>
        </CardContent>
      </Card>

      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle>Product Manager</CardTitle>
          <CardDescription>Template for Product Management roles</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            For roles focused on product strategy, roadmap planning, and feature development.
          </p>
          <Button
            className="w-full bg-atlan-primary hover:bg-atlan-primary-dark"
            onClick={() => handleUseTemplate("product-manager")}
          >
            Use Template
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

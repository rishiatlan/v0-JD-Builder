"use client"

import { EnhancedHeader } from "@/components/enhanced-header"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AtlanLogo } from "@/components/atlan-logo"
import { FileText, Users, CheckCircle, ArrowRight } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col">
      <EnhancedHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-slate-50 to-white py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <AtlanLogo className="h-16 w-auto mx-auto mb-8" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">Create World-Class Job Descriptions</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Build compelling, inclusive, and effective job descriptions that attract top talent and reflect Atlan's
              unique voice and values.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => router.push("/jd/new")}
                className="bg-atlan-primary hover:bg-atlan-primary-dark text-white px-8 py-6 text-lg"
              >
                Create New JD
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => router.push("/history")}
                variant="outline"
                className="border-atlan-primary text-atlan-primary hover:bg-atlan-primary/10 px-8 py-6 text-lg"
              >
                View My JDs
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Powerful JD Creation Tools</h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-50 rounded-lg p-6 text-center">
                <div className="bg-atlan-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-atlan-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI-Powered Generation</h3>
                <p className="text-slate-600">
                  Create professional job descriptions using Gemini AI based on key role information.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-6 text-center">
                <div className="bg-atlan-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-atlan-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Inclusive Language</h3>
                <p className="text-slate-600">
                  Automatically identify and suggest alternatives for potentially biased or non-inclusive language.
                </p>
              </div>

              <div className="bg-slate-50 rounded-lg p-6 text-center">
                <div className="bg-atlan-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-atlan-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Atlan Voice Check</h3>
                <p className="text-slate-600">
                  Ensure your JD aligns with Atlan's strategic, inspirational, and mission-driven voice.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Create Better Job Descriptions?</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
              Start creating job descriptions that attract the best talent.
            </p>

            <Button
              onClick={() => router.push("/jd/new")}
              className="bg-atlan-primary hover:bg-atlan-primary-dark text-white px-8 py-6 text-lg"
            >
              Create New JD
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      <EnhancedFooter />
    </div>
  )
}

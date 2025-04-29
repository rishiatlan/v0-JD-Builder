import Link from "next/link"
import { EnhancedHeader } from "@/components/enhanced-header"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileText, Users, Zap, Award } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <EnhancedHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white to-slate-50 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 gradient-text">
                Create Exceptional Job Descriptions with AI
              </h1>
              <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                Atlan's JD Builder helps you craft compelling, inclusive, and effective job descriptions that attract
                top talent aligned with your company's values.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/jd/new">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                    Create New JD
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/templates">
                  <Button size="lg" variant="outline">
                    Browse Templates
                    <FileText className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Use Atlan's JD Builder?</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-card transition-shadow duration-300">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI-Powered</h3>
                <p className="text-slate-600">
                  Leverage advanced AI to generate professional job descriptions tailored to your specific needs and
                  company culture.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-card transition-shadow duration-300">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Inclusive Language</h3>
                <p className="text-slate-600">
                  Our tool automatically detects and suggests alternatives to biased language, helping you attract
                  diverse talent.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-card transition-shadow duration-300">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Industry Standards</h3>
                <p className="text-slate-600">
                  Built on Atlan's Standards of Excellence, ensuring your job descriptions meet the highest quality
                  benchmarks.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="absolute left-8 top-0 h-full w-0.5 bg-primary/20"></div>

                <div className="relative z-10 flex items-start mb-8">
                  <div className="flex-shrink-0 bg-primary text-white h-16 w-16 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Fill Out the Questionnaire</h3>
                    <p className="text-slate-600">
                      Answer a few targeted questions about the role, including responsibilities, qualifications, and
                      what makes this position unique at your company.
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-start mb-8">
                  <div className="flex-shrink-0 bg-primary text-white h-16 w-16 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Review AI-Generated Content</h3>
                    <p className="text-slate-600">
                      Our AI generates a comprehensive job description based on your inputs, following best practices
                      for clarity, inclusivity, and engagement.
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-start mb-8">
                  <div className="flex-shrink-0 bg-primary text-white h-16 w-16 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Refine and Customize</h3>
                    <p className="text-slate-600">
                      Edit the generated content to match your company's voice and add specific details. Our tool
                      provides suggestions for improvements along the way.
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-start">
                  <div className="flex-shrink-0 bg-primary text-white h-16 w-16 rounded-full flex items-center justify-center mr-4">
                    <span className="text-xl font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Export and Share</h3>
                    <p className="text-slate-600">
                      Download your finalized job description in multiple formats or save it to your account for future
                      reference and sharing with your team.
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-12">
                <Link href="/jd/new">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                    Get Started Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="font-semibold text-blue-700">SM</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Sarah Miller</h4>
                    <p className="text-sm text-slate-500">HR Director, TechCorp</p>
                  </div>
                </div>
                <p className="text-slate-600 italic">
                  "Atlan's JD Builder has transformed our hiring process. We're now attracting more qualified candidates
                  and seeing higher engagement with our job postings."
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <span className="font-semibold text-green-700">JT</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">James Thompson</h4>
                    <p className="text-sm text-slate-500">Talent Acquisition, GrowthStartup</p>
                  </div>
                </div>
                <p className="text-slate-600 italic">
                  "The AI suggestions for inclusive language have been eye-opening. We've seen a 30% increase in diverse
                  applicants since using this tool."
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <span className="font-semibold text-purple-700">AP</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Aisha Patel</h4>
                    <p className="text-sm text-slate-500">CEO, InnovateNow</p>
                  </div>
                </div>
                <p className="text-slate-600 italic">
                  "As a small business owner, I don't have time to craft perfect job descriptions. This tool helps me
                  create professional JDs in minutes instead of hours."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Create Better Job Descriptions?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join thousands of companies using Atlan's JD Builder to attract and hire exceptional talent.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/jd/new">
                <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-slate-100">
                  Create Your First JD
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/standards">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Learn About Our Standards
                  <Award className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <EnhancedFooter />
    </div>
  )
}

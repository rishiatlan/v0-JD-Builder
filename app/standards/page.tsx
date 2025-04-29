import { EnhancedHeader } from "@/components/enhanced-header"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, ArrowRight, FileText, Users, Zap, Award, Target } from "lucide-react"

export default function StandardsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <EnhancedHeader />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/10 to-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Atlan Standard of Excellence</h1>
              <p className="text-xl text-slate-600 mb-8">
                Our commitment to creating exceptional job descriptions that attract the right talent and set clear
                expectations.
              </p>
            </div>
          </div>
        </section>

        {/* Core Principles */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto mb-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Our Core Principles</h2>
              <p className="text-lg text-slate-600">
                The Atlan Standard of Excellence for job descriptions is built on five core principles that ensure every
                JD is effective, inclusive, and compelling.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-100 hover:shadow-card transition-shadow duration-300">
                <div className="flex items-start mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Clarity and Precision</h3>
                    <p className="text-slate-600">
                      Every job description clearly articulates responsibilities, requirements, and expectations without
                      ambiguity. We use plain language and avoid jargon to ensure understanding across diverse
                      audiences.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 pl-16">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Concise, specific language</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Well-defined responsibilities</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Clear success metrics</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-100 hover:shadow-card transition-shadow duration-300">
                <div className="flex items-start mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Inclusivity and Diversity</h3>
                    <p className="text-slate-600">
                      Our job descriptions are designed to attract diverse talent by using inclusive language and
                      avoiding biased terms. We focus on essential qualifications rather than preferences that might
                      exclude qualified candidates.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 pl-16">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Gender-neutral language</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Focus on skills, not background</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Accessible formatting</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-100 hover:shadow-card transition-shadow duration-300">
                <div className="flex items-start mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Completeness</h3>
                    <p className="text-slate-600">
                      A complete job description covers all necessary aspects: role overview, responsibilities,
                      qualifications, benefits, company culture, and growth opportunities. Nothing essential is left to
                      assumption.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 pl-16">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Comprehensive role description</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Company context and culture</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Growth and development paths</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-soft border border-slate-100 hover:shadow-card transition-shadow duration-300">
                <div className="flex items-start mb-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Engagement and Appeal</h3>
                    <p className="text-slate-600">
                      Beyond listing requirements, our job descriptions tell a compelling story about the role and
                      organization. They answer the crucial question: "Why would someone want this job?"
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 pl-16">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Compelling company mission</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Role impact and importance</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">Unique benefits and perks</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Our Technology */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto mb-12 text-center">
              <h2 className="text-3xl font-bold mb-4">Our Technology</h2>
              <p className="text-lg text-slate-600">
                The JD Builder leverages advanced AI technology to help you create job descriptions that meet the Atlan
                Standard.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-card transition-shadow duration-300">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Bias Detection</h3>
                <p className="text-slate-600 mb-4">
                  Our AI automatically identifies potentially biased language and suggests more inclusive alternatives
                  to ensure your job descriptions appeal to diverse candidates.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-card transition-shadow duration-300">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Clarity Scoring</h3>
                <p className="text-slate-600 mb-4">
                  Our system analyzes your content for readability, jargon, and ambiguity, providing a clarity score and
                  suggestions for improvement to ensure your message is clear.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-soft hover:shadow-card transition-shadow duration-300">
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Completeness Check</h3>
                <p className="text-slate-600 mb-4">
                  Our tool ensures all essential components of a job description are included, from responsibilities to
                  benefits, providing a comprehensive view of the role.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Continuous Improvement */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Continuous Improvement</h2>
                <p className="text-lg text-slate-600">
                  The Atlan Standard is not static. We continuously refine our approach based on research, feedback, and
                  evolving best practices in talent acquisition.
                </p>
              </div>

              <div className="bg-primary/5 p-8 rounded-xl border border-primary/20">
                <h3 className="text-xl font-semibold mb-4">Our Commitment to Excellence</h3>
                <p className="mb-6">
                  We believe that exceptional job descriptions are the foundation of successful hiring. Our standards
                  ensure that every job description is:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Reflective of your company's unique culture and values</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Designed to attract candidates who will thrive in your organization</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Optimized for search engines and job boards to maximize visibility</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Regularly updated to reflect the latest research on effective hiring practices</span>
                  </li>
                </ul>
                <p>
                  By using the Atlan JD Builder, you're not just creating a job description—you're participating in a
                  community committed to excellence in hiring and talent acquisition.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Start Creating Excellence</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Ready to create job descriptions that meet the Atlan Standard of Excellence? Use our JD Builder to craft
              compelling, inclusive, and effective job descriptions.
            </p>
            <Link href="/jd/new">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-slate-100">
                Create Your First JD
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <EnhancedFooter />
    </div>
  )
}

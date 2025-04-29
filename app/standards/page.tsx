"use client"

import { EnhancedHeader } from "@/components/enhanced-header"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { ProtectedRoute } from "@/components/protected-route"
import { CheckCircle, AlertTriangle, FileText, Users, Target, Zap } from "lucide-react"

export default function StandardsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <EnhancedHeader />

      <main className="flex-grow">
        <ProtectedRoute allowUnauthenticated={true}>
          {/* Hero Section */}
          <section className="bg-gradient-to-b from-primary/10 to-white py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">Atlan JD Standards</h1>
                <p className="text-xl text-slate-600 mb-8">
                  Our framework for creating world-class job descriptions that attract top talent and align with Atlan's
                  mission
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
                  The Atlan JD Standards are built on five core principles that ensure every job description is
                  effective, inclusive, and compelling.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start mb-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Clarity and Precision</h3>
                      <p className="text-slate-600">
                        Every job description clearly articulates responsibilities, requirements, and expectations
                        without ambiguity. We use plain language and avoid jargon to ensure understanding across diverse
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

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
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

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-start mb-4">
                    <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">Strategic Focus</h3>
                      <p className="text-slate-600">
                        Every job description clearly articulates how the role contributes to Atlan's strategic
                        advantage and mission. We emphasize the impact and outcomes of the role, not just the day-to-day
                        tasks.
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 pl-16">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">Mission alignment</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">Strategic impact highlighted</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-sm">Outcome-focused language</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300">
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

          {/* JD Framework */}
          <section className="py-16 bg-slate-50">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto mb-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Atlan JD Framework</h2>
                <p className="text-lg text-slate-600">
                  Every Atlan job description follows a structured format designed to provide comprehensive information
                  and create an engaging candidate experience.
                </p>
              </div>

              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-primary/20 hidden md:block"></div>

                  <div className="space-y-12">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 flex items-start mb-4 md:mb-0">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mr-4 z-10">
                          <span className="text-2xl font-bold text-primary">1</span>
                        </div>
                        <h3 className="text-xl font-semibold md:hidden">Role Overview</h3>
                      </div>
                      <div className="md:w-3/4 bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-xl font-semibold mb-3 hidden md:block">Role Overview</h3>
                        <p className="text-slate-600 mb-4">
                          Start with an engaging overview that captures the essence of the role and why it matters at
                          Atlan. Connect the position to our mission of helping teams do their best work with data.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <p className="text-sm italic text-slate-700">
                            "Join Atlan as a Senior Product Designer to shape the future of data collaboration. You'll
                            be at the forefront of creating intuitive experiences that help data teams work better
                            together, directly impacting how organizations around the world make data-driven decisions."
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 flex items-start mb-4 md:mb-0">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mr-4 z-10">
                          <span className="text-2xl font-bold text-primary">2</span>
                        </div>
                        <h3 className="text-xl font-semibold md:hidden">What will you do?</h3>
                      </div>
                      <div className="md:w-3/4 bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-xl font-semibold mb-3 hidden md:block">What will you do?</h3>
                        <p className="text-slate-600 mb-4">
                          List 7-10 key responsibilities using action verbs. Focus on outcomes rather than tasks. Be
                          specific about what the person will own and accomplish.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <ul className="text-sm italic text-slate-700 space-y-2">
                            <li>• Design and implement data models that scale with our growing user base</li>
                            <li>• Develop and maintain ETL processes to ensure data quality and consistency</li>
                            <li>
                              • Collaborate with product teams to translate business requirements into technical
                              solutions
                            </li>
                            <li>• Optimize database performance and query efficiency across the platform</li>
                            <li>• Build monitoring systems to ensure data pipeline reliability and performance</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 flex items-start mb-4 md:mb-0">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mr-4 z-10">
                          <span className="text-2xl font-bold text-primary">3</span>
                        </div>
                        <h3 className="text-xl font-semibold md:hidden">What makes you a great match for us?</h3>
                      </div>
                      <div className="md:w-3/4 bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-xl font-semibold mb-3 hidden md:block">
                          What makes you a great match for us?
                        </h3>
                        <p className="text-slate-600 mb-4">
                          Distinguish between "must-have" and "nice-to-have" qualifications. Focus on skills and
                          competencies rather than years of experience. Include both technical and soft skills relevant
                          to the role.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <p className="text-sm font-medium mb-2">Must-Have:</p>
                          <ul className="text-sm italic text-slate-700 space-y-1 mb-3">
                            <li>• Experience with SQL and database optimization techniques</li>
                            <li>• Proficiency in at least one programming language (Python, Java, etc.)</li>
                            <li>• Knowledge of data modeling and ETL processes</li>
                          </ul>
                          <p className="text-sm font-medium mb-2">Nice-to-Have:</p>
                          <ul className="text-sm italic text-slate-700 space-y-1">
                            <li>• Experience with cloud platforms (AWS, GCP, Azure)</li>
                            <li>• Familiarity with data governance principles</li>
                            <li>• Knowledge of modern data stack tools</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 flex items-start mb-4 md:mb-0">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mr-4 z-10">
                          <span className="text-2xl font-bold text-primary">4</span>
                        </div>
                        <h3 className="text-xl font-semibold md:hidden">Benefits & Culture</h3>
                      </div>
                      <div className="md:w-3/4 bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-xl font-semibold mb-3 hidden md:block">Benefits & Culture</h3>
                        <p className="text-slate-600 mb-4">
                          Highlight Atlan's unique benefits, values, and culture. Include information about remote work
                          policies, learning opportunities, and other perks that make Atlan special.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <p className="text-sm italic text-slate-700">
                            "At Atlan, we offer competitive compensation, flexible remote work options, and a learning
                            budget for professional development. Our culture is built on transparency, ownership, and
                            continuous learning. We have regular team events, both virtual and in-person, and encourage
                            work-life balance through our unlimited PTO policy."
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 flex items-start mb-4 md:mb-0">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mr-4 z-10">
                          <span className="text-2xl font-bold text-primary">5</span>
                        </div>
                        <h3 className="text-xl font-semibold md:hidden">Diversity Statement</h3>
                      </div>
                      <div className="md:w-3/4 bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-xl font-semibold mb-3 hidden md:block">Diversity Statement</h3>
                        <p className="text-slate-600 mb-4">
                          Include Atlan's commitment to diversity, equity, and inclusion. Make it clear that we welcome
                          candidates from all backgrounds and identities.
                        </p>
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                          <p className="text-sm italic text-slate-700">
                            "Atlan is an equal opportunity employer. We celebrate diversity and are committed to
                            creating an inclusive environment for all employees. We welcome applications from all
                            individuals regardless of race, color, religion, gender, sexual orientation, gender
                            identity, national origin, age, disability, or any other status protected by law."
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Language Guidelines */}
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto mb-12 text-center">
                <h2 className="text-3xl font-bold mb-4">Language Guidelines</h2>
                <p className="text-lg text-slate-600">
                  The words we choose matter. Follow these guidelines to ensure your job descriptions are inclusive,
                  engaging, and effective.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold">Do Use</h3>
                  </div>
                  <ul className="space-y-3 pl-13">
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <div>
                        <p className="font-medium">Action verbs</p>
                        <p className="text-sm text-slate-600">Design, develop, create, implement, analyze</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <div>
                        <p className="font-medium">Inclusive terms</p>
                        <p className="text-sm text-slate-600">Team members, people, individuals, they/them</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <div>
                        <p className="font-medium">Specific requirements</p>
                        <p className="text-sm text-slate-600">
                          "Experience with React" instead of "Frontend experience"
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <div>
                        <p className="font-medium">Growth-oriented language</p>
                        <p className="text-sm text-slate-600">Opportunity, develop, learn, advance, contribute</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <div>
                        <p className="font-medium">Impact-focused descriptions</p>
                        <p className="text-sm text-slate-600">
                          "You'll help customers succeed" vs. "Customer support role"
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                  <div className="flex items-center mb-4">
                    <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-red-600"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold">Avoid Using</h3>
                  </div>
                  <ul className="space-y-3 pl-13">
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <div>
                        <p className="font-medium">Gendered terms</p>
                        <p className="text-sm text-slate-600">Guys, manpower, mankind, he/she</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <div>
                        <p className="font-medium">Age-biased language</p>
                        <p className="text-sm text-slate-600">Young, energetic, digital native, mature</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <div>
                        <p className="font-medium">Unnecessary jargon</p>
                        <p className="text-sm text-slate-600">Industry-specific terms without explanation</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <div>
                        <p className="font-medium">Vague requirements</p>
                        <p className="text-sm text-slate-600">"Good communication skills" without context</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <div>
                        <p className="font-medium">Superlatives</p>
                        <p className="text-sm text-slate-600">"Ninja," "rockstar," "guru," "world-class"</p>
                      </div>
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
                  The JD Builder leverages advanced AI technology to help you create job descriptions that meet the
                  Atlan JD Standards.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <AlertTriangle className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Bias Detection</h3>
                  <p className="text-slate-600 mb-4">
                    Our AI automatically identifies potentially biased language and suggests more inclusive alternatives
                    to ensure your job descriptions appeal to diverse candidates.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Clarity Scoring</h3>
                  <p className="text-slate-600 mb-4">
                    Our system analyzes your content for readability, jargon, and ambiguity, providing a clarity score
                    and suggestions for improvement to ensure your message is clear.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Completeness Check</h3>
                  <p className="text-slate-600 mb-4">
                    Our tool ensures all essential components of a job description are included, from responsibilities
                    to benefits, providing a comprehensive view of the role.
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
                    The Atlan JD Standards are not static. We continuously refine our approach based on research,
                    feedback, and evolving best practices in talent acquisition.
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
                Ready to create job descriptions that meet the Atlan JD Standards? Use our JD Builder to craft
                compelling, inclusive, and effective job descriptions.
              </p>
              <a
                href="/jd/new"
                className="inline-flex items-center px-6 py-3 bg-white text-primary font-medium rounded-md hover:bg-slate-100 transition-colors"
              >
                Create Your First JD
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </section>
        </ProtectedRoute>
      </main>

      <EnhancedFooter />
    </div>
  )
}

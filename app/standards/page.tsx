import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "JD Standards | Atlan",
  description: "Job Description Standards and Best Practices at Atlan",
}

export default function StandardsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Atlan JD Standards</h1>

      <div className="space-y-8">
        <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Our Approach to Job Descriptions</h2>
          <p className="text-slate-600 mb-4">
            At Atlan, we believe that a great job description is the foundation of a successful hiring process. Our JDs
            are designed to be clear, inclusive, and representative of our culture and values.
          </p>
          <p className="text-slate-600">
            The following standards ensure that all Atlan job descriptions maintain a consistent quality and effectively
            communicate both the requirements of the role and what makes Atlan a unique place to work.
          </p>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Core Standards</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium text-atlan-primary mb-2">Clarity and Conciseness</h3>
              <p className="text-slate-600">
                Job descriptions should be clear, concise, and free of jargon. Use simple language that accurately
                describes the role without unnecessary complexity. Aim for 600-800 words total.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-atlan-primary mb-2">Inclusive Language</h3>
              <p className="text-slate-600">
                Use gender-neutral language and avoid terms that might discourage diverse candidates. Focus on essential
                requirements rather than "nice-to-haves" that might deter qualified applicants.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium text-atlan-primary mb-2">Structured Format</h3>
              <p className="text-slate-600">All Atlan JDs follow a consistent structure:</p>
              <ul className="list-disc pl-6 mt-2 text-slate-600 space-y-1">
                <li>Position Overview (company context and role importance)</li>
                <li>What You'll Do (key responsibilities and objectives)</li>
                <li>What Makes You a Great Match (required skills and experience)</li>
                <li>About Atlan (company mission and culture)</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Section-Specific Guidelines</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium text-atlan-primary mb-2">Position Overview</h3>
              <p className="text-slate-600">This section should:</p>
              <ul className="list-disc pl-6 mt-2 text-slate-600 space-y-1">
                <li>Explain why the role exists and its impact on the company</li>
                <li>Provide context about the team and reporting structure</li>
                <li>Be 100-150 words in length</li>
                <li>Avoid generic statements that could apply to any role</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-atlan-primary mb-2">What You'll Do</h3>
              <p className="text-slate-600">This section should:</p>
              <ul className="list-disc pl-6 mt-2 text-slate-600 space-y-1">
                <li>List 5-7 key responsibilities in order of importance</li>
                <li>Use action verbs at the beginning of each bullet point</li>
                <li>Focus on outcomes rather than tasks</li>
                <li>Include both day-to-day activities and long-term objectives</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-atlan-primary mb-2">What Makes You a Great Match</h3>
              <p className="text-slate-600">This section should:</p>
              <ul className="list-disc pl-6 mt-2 text-slate-600 space-y-1">
                <li>Clearly distinguish between required and preferred qualifications</li>
                <li>Focus on skills and experience, not personal attributes</li>
                <li>Specify years of experience only when truly necessary</li>
                <li>Include both technical and soft skills relevant to the role</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium text-atlan-primary mb-2">About Atlan</h3>
              <p className="text-slate-600">This section should:</p>
              <ul className="list-disc pl-6 mt-2 text-slate-600 space-y-1">
                <li>Briefly describe Atlan's mission and values</li>
                <li>Highlight key aspects of the company culture</li>
                <li>Mention relevant benefits and growth opportunities</li>
                <li>Include a statement on diversity and inclusion</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Quality Checklist</h2>

          <p className="text-slate-600 mb-4">
            Before finalizing any job description, ensure it meets these quality standards:
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-slate-800 mb-2">Content Quality</h3>
              <ul className="list-disc pl-6 text-slate-600 space-y-1">
                <li>Free of spelling and grammatical errors</li>
                <li>No unexplained acronyms or jargon</li>
                <li>Accurate representation of the role</li>
                <li>Aligned with company values and culture</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-slate-800 mb-2">Inclusivity Check</h3>
              <ul className="list-disc pl-6 text-slate-600 space-y-1">
                <li>Gender-neutral language throughout</li>
                <li>No unnecessary requirements that limit diversity</li>
                <li>Accessible formatting and language</li>
                <li>Emphasis on skills over credentials when possible</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-slate-800 mb-2">Structural Elements</h3>
              <ul className="list-disc pl-6 text-slate-600 space-y-1">
                <li>All required sections are present</li>
                <li>Appropriate length for each section</li>
                <li>Logical flow of information</li>
                <li>Consistent formatting throughout</li>
              </ul>
            </div>

            <div className="bg-slate-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-slate-800 mb-2">Candidate Appeal</h3>
              <ul className="list-disc pl-6 text-slate-600 space-y-1">
                <li>Clear value proposition for candidates</li>
                <li>Engaging and authentic tone</li>
                <li>Realistic expectations</li>
                <li>Compelling reasons to apply</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

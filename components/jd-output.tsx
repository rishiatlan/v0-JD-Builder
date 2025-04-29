interface JDOutputProps {
  data: any
}

export function JDOutput({ data }: JDOutputProps) {
  const { title, department, sections } = data

  const renderList = (items: string[] | string) => {
    if (typeof items === "string") {
      return <p className="mb-4">{items}</p>
    }

    return (
      <ul className="list-disc pl-5 space-y-2 mb-4">
        {items.map((item: string, index: number) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    )
  }

  // Calculate a start date 1 month from now
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() + 1)
  const formattedStartDate = startDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })

  return (
    <div className="prose max-w-none">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-atlan-primary mb-2">{title}</h1>
        <p className="text-lg text-slate-600">{department}</p>
        <p className="text-sm text-slate-500 mt-2">
          Engineering Hiring Manager: {department} Hiring Manager | Date of Intake:{" "}
          {new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })} | Bi-/Weekly
          Cadence Call: To Be Scheduled | Start Date: {formattedStartDate}
        </p>
      </div>

      {/* Static Introduction */}
      <div className="mb-8">
        <p className="mb-4">
          Data is at the core of modern business, yet many teams struggle with its overwhelming volume and complexity.
          At Atlan, we're changing that. As the world's first active metadata platform, we help organisations transform
          data chaos into clarity and seamless collaboration.
        </p>
        <p className="mb-4">
          From Fortune 500 leaders to hyper-growth startups, from automotive innovators redefining mobility to
          healthcare organisations saving lives, and from Wall Street powerhouses to Silicon Valley trailblazers — we
          empower ambitious teams across industries to unlock the full potential of their data.
        </p>
        <p className="mb-4">
          Recognised as leaders by Gartner and Forrester and backed by Insight Partners, Atlan is at the forefront of
          reimagining how humans and data work together. Joining us means becoming part of a movement to shape a future
          where data drives extraordinary outcomes.
        </p>
      </div>

      {/* Position Overview - LLM Generated */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Position Overview</h2>
        <p>{sections.overview}</p>
      </div>

      {/* What will you do? - LLM Generated */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">What will you do? 🤔</h2>
        {renderList(sections.responsibilities)}
      </div>

      {/* What makes you a great match for us? - LLM Generated */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">What makes you a great match for us? 😍</h2>
        {renderList(sections.qualifications)}
      </div>

      {/* Why Atlan for You? - Static */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Why Atlan for You?</h2>
        <p className="mb-4">
          At Atlan, we believe the future belongs to the humans of data. From curing diseases to advancing space
          exploration, data teams are powering humanity's greatest achievements. Yet, working with data can be
          chaotic—our mission is to transform that experience. We're reimagining how data teams collaborate by building
          the home they deserve, enabling them to create winning data cultures and drive meaningful progress.
        </p>
        <p className="mb-4">Joining Atlan means:</p>
        <ol className="list-decimal pl-5 space-y-2 mb-4">
          <li>
            <strong>Ownership from Day One:</strong> Whether you're an intern or a full-time teammate, you'll own
            impactful projects, chart your growth, and collaborate with some of the best minds in the industry.
          </li>
          <li>
            <strong>Limitless Opportunities:</strong> At Atlan, your growth has no boundaries. If you're ready to take
            initiative, the sky's the limit.
          </li>
          <li>
            <strong>A Global Data Community:</strong> We're deeply embedded in the modern data stack, contributing to
            open-source projects, sponsoring meet-ups, and empowering team members to grow through conferences and
            learning opportunities.
          </li>
        </ol>
        <p className="mb-4">
          As a fast-growing, fully remote company trusted by global leaders like Cisco, Nasdaq, and HubSpot, we're
          creating a category-defining platform for data and AI governance. Backed by top investors, we've achieved 7X
          revenue growth in two years and are building a talented team spanning 15+ countries.
        </p>
        <p>
          If you're ready to do your life's best work and help shape the future of data collaboration, join Atlan and
          become part of a mission to empower the humans of data to achieve more, together.
        </p>
      </div>

      {/* Equal Opportunity Employer - Static */}
      <div className="mb-4 p-6 bg-atlan-primary/10 rounded-lg border border-atlan-primary/20">
        <h2 className="text-xl font-semibold mb-3 text-atlan-primary">We are an equal opportunity employer</h2>
        <p>
          At Atlan, we're committed to helping data teams do their lives' best work. We believe that diversity and
          authenticity are the cornerstones of innovation, and by embracing varied perspectives and experiences, we can
          create a workplace where everyone thrives. Atlan is proud to be an equal opportunity employer and does not
          discriminate based on race, color, religion, national origin, age, disability, sex, gender identity or
          expression, sexual orientation, marital status, military or veteran status, or any other characteristic
          protected by law.
        </p>
      </div>
    </div>
  )
}

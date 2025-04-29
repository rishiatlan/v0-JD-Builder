// PDF generation utilities

/**
 * Converts a job description to HTML format suitable for PDF generation
 */
export function jdToHtml(jdData: any): string {
  const { title, department, sections } = jdData

  // Calculate a start date 1 month from now
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() + 1)
  const formattedStartDate = startDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
  const currentDate = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })

  // Format responsibilities and qualifications
  const responsibilitiesHtml = Array.isArray(sections.responsibilities)
    ? `<ul>${sections.responsibilities.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<p>${sections.responsibilities}</p>`

  const qualificationsHtml = Array.isArray(sections.qualifications)
    ? `<ul>${sections.qualifications.map((item) => `<li>${item}</li>`).join("")}</ul>`
    : `<p>${sections.qualifications}</p>`

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title} - Job Description</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          max-width: 800px; 
          margin: 0 auto; 
          padding: 20px;
          color: #333;
        }
        h1 { 
          color: #00A2B8; 
          font-size: 24pt; 
          margin-bottom: 10px; 
        }
        h2 { 
          color: #00A2B8; 
          font-size: 16pt; 
          margin-top: 20px; 
          margin-bottom: 10px; 
        }
        .metadata {
          font-size: 10pt;
          color: #666;
          margin-bottom: 20px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        ul { 
          margin-bottom: 20px; 
        }
        li { 
          margin-bottom: 8px; 
        }
        p { 
          margin-bottom: 16px; 
        }
        .equal-opportunity {
          background-color: #e6f7f9;
          border: 1px solid #b3e0e8;
          padding: 15px;
          border-radius: 5px;
          margin-top: 30px;
        }
        .equal-opportunity h2 {
          color: #00A2B8;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <h2>${department}</h2>
      
      <div class="metadata">
        Engineering Hiring Manager: ${department} Hiring Manager | 
        Date of Intake: ${currentDate} | 
        Bi-/Weekly Cadence Call: To Be Scheduled | 
        Start Date: ${formattedStartDate}
      </div>
      
      <p>
        Data is at the core of modern business, yet many teams struggle with its overwhelming volume and complexity.
        At Atlan, we're changing that. As the world's first active metadata platform, we help organisations transform
        data chaos into clarity and seamless collaboration.
      </p>
      
      <p>
        From Fortune 500 leaders to hyper-growth startups, from automotive innovators redefining mobility to
        healthcare organisations saving lives, and from Wall Street powerhouses to Silicon Valley trailblazers — we
        empower ambitious teams across industries to unlock the full potential of their data.
      </p>
      
      <p>
        Recognised as leaders by Gartner and Forrester and backed by Insight Partners, Atlan is at the forefront of
        reimagining how humans and data work together. Joining us means becoming part of a movement to shape a future
        where data drives extraordinary outcomes.
      </p>
      
      <h2>Position Overview</h2>
      <p>${sections.overview}</p>
      
      <h2>What will you do? 🤔</h2>
      ${responsibilitiesHtml}
      
      <h2>What makes you a great match for us? 😍</h2>
      ${qualificationsHtml}
      
      <h2>Why Atlan for You?</h2>
      <p>
        At Atlan, we believe the future belongs to the humans of data. From curing diseases to advancing space
        exploration, data teams are powering humanity's greatest achievements. Yet, working with data can be
        chaotic—our mission is to transform that experience. We're reimagining how data teams collaborate by building
        the home they deserve, enabling them to create winning data cultures and drive meaningful progress.
      </p>
      
      <p>Joining Atlan means:</p>
      <ol>
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
      
      <p>
        As a fast-growing, fully remote company trusted by global leaders like Cisco, Nasdaq, and HubSpot, we're
        creating a category-defining platform for data and AI governance. Backed by top investors, we've achieved 7X
        revenue growth in two years and are building a talented team spanning 15+ countries.
      </p>
      
      <p>
        If you're ready to do your life's best work and help shape the future of data collaboration, join Atlan and
        become part of a mission to empower the humans of data to achieve more, together.
      </p>
      
      <div class="equal-opportunity">
        <h2>We are an equal opportunity employer</h2>
        <p>
          At Atlan, we're committed to helping data teams do their lives' best work. We believe that diversity and
          authenticity are the cornerstones of innovation, and by embracing varied perspectives and experiences, we can
          create a workplace where everyone thrives. Atlan is proud to be an equal opportunity employer and does not
          discriminate based on race, color, religion, national origin, age, disability, sex, gender identity or
          expression, sexual orientation, marital status, military or veteran status, or any other characteristic
          protected by law.
        </p>
      </div>
    </body>
    </html>
  `
}

/**
 * Generates a Word-compatible HTML document for the job description
 */
export function jdToWordHtml(jdData: any): string {
  // Similar to jdToHtml but with Word-specific formatting
  return jdToHtml(jdData)
}

/**
 * Converts a job description to plain text format
 */
export function jdToText(jdData: any): string {
  const { title, department, sections } = jdData

  // Calculate a start date 1 month from now
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() + 1)
  const formattedStartDate = startDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
  const currentDate = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })

  let text = `# ${title}\n`
  text += `## ${department}\n\n`
  text += `Engineering Hiring Manager: ${department} Hiring Manager\n`
  text += `Date of Intake: ${currentDate}\n`
  text += `Bi-/Weekly Cadence Call: To Be Scheduled\n`
  text += `Start Date: ${formattedStartDate}\n\n`

  // Static Introduction
  text += `Data is at the core of modern business, yet many teams struggle with its overwhelming volume and complexity. At Atlan, we're changing that. As the world's first active metadata platform, we help organisations transform data chaos into clarity and seamless collaboration.\n\n`
  text += `From Fortune 500 leaders to hyper-growth startups, from automotive innovators redefining mobility to healthcare organisations saving lives, and from Wall Street powerhouses to Silicon Valley trailblazers — we empower ambitious teams across industries to unlock the full potential of their data.\n\n`
  text += `Recognised as leaders by Gartner and Forrester and backed by Insight Partners, Atlan is at the forefront of reimagining how humans and data work together. Joining us means becoming part of a movement to shape a future where data drives extraordinary outcomes.\n\n`

  // Position Overview
  text += `## Position Overview\n${sections.overview}\n\n`

  // What will you do?
  text += `## What will you do? 🤔\n`
  if (Array.isArray(sections.responsibilities)) {
    sections.responsibilities.forEach((item: string) => {
      text += `- ${item}\n`
    })
  } else {
    text += sections.responsibilities
  }
  text += "\n\n"

  // What makes you a great match for us?
  text += `## What makes you a great match for us? 😍\n`
  if (Array.isArray(sections.qualifications)) {
    sections.qualifications.forEach((item: string) => {
      text += `- ${item}\n`
    })
  } else {
    text += sections.qualifications
  }
  text += "\n\n"

  // Why Atlan for You?
  text += `## Why Atlan for You?\n`
  text += `At Atlan, we believe the future belongs to the humans of data. From curing diseases to advancing space exploration, data teams are powering humanity's greatest achievements. Yet, working with data can be chaotic—our mission is to transform that experience. We're reimagining how data teams collaborate by building the home they deserve, enabling them to create winning data cultures and drive meaningful progress.\n\n`
  text += `Joining Atlan means:\n`
  text += `1. Ownership from Day One: Whether you're an intern or a full-time teammate, you'll own impactful projects, chart your growth, and collaborate with some of the best minds in the industry.\n`
  text += `2. Limitless Opportunities: At Atlan, your growth has no boundaries. If you're ready to take initiative, the sky's the limit.\n`
  text += `3. A Global Data Community: We're deeply embedded in the modern data stack, contributing to open-source projects, sponsoring meet-ups, and empowering team members to grow through conferences and learning opportunities.\n\n`
  text += `As a fast-growing, fully remote company trusted by global leaders like Cisco, Nasdaq, and HubSpot, we're creating a category-defining platform for data and AI governance. Backed by top investors, we've achieved 7X revenue growth in two years and are building a talented team spanning 15+ countries.\n\n`
  text += `If you're ready to do your life's best work and help shape the future of data collaboration, join Atlan and become part of a mission to empower the humans of data to achieve more, together.\n\n`

  // Equal Opportunity Employer
  text += `## We are an equal opportunity employer\n`
  text += `At Atlan, we're committed to helping data teams do their lives' best work. We believe that diversity and authenticity are the cornerstones of innovation, and by embracing varied perspectives and experiences, we can create a workplace where everyone thrives. Atlan is proud to be an equal opportunity employer and does not discriminate based on race, color, religion, national origin, age, disability, sex, gender identity or expression, sexual orientation, marital status, military or veteran status, or any other characteristic protected by law.\n`

  return text
}

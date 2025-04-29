import { Document, Paragraph, TextRun, HeadingLevel, Packer, BorderStyle } from "docx"

/**
 * Generates a proper Word document (.docx) for the job description
 */
export async function generateWordDocument(jdData: any): Promise<Blob> {
  const { title, department, sections } = jdData

  // Calculate a start date 1 month from now
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() + 1)
  const formattedStartDate = startDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
  const currentDate = new Date().toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          }),

          // Department
          new Paragraph({
            text: department,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          // Metadata
          new Paragraph({
            children: [
              new TextRun({
                text: `Engineering Hiring Manager: ${department} Hiring Manager | `,
                size: 20,
                color: "666666",
              }),
              new TextRun({
                text: `Date of Intake: ${currentDate} | `,
                size: 20,
                color: "666666",
              }),
              new TextRun({
                text: `Bi-/Weekly Cadence Call: To Be Scheduled | `,
                size: 20,
                color: "666666",
              }),
              new TextRun({
                text: `Start Date: ${formattedStartDate}`,
                size: 20,
                color: "666666",
              }),
            ],
            spacing: { after: 400 },
            border: {
              bottom: {
                color: "EEEEEE",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 1,
              },
            },
          }),

          // Company Introduction
          new Paragraph({
            text: "Data is at the core of modern business, yet many teams struggle with its overwhelming volume and complexity. At Atlan, we're changing that. As the world's first active metadata platform, we help organisations transform data chaos into clarity and seamless collaboration.",
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "From Fortune 500 leaders to hyper-growth startups, from automotive innovators redefining mobility to healthcare organisations saving lives, and from Wall Street powerhouses to Silicon Valley trailblazers — we empower ambitious teams across industries to unlock the full potential of their data.",
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "Recognised as leaders by Gartner and Forrester and backed by Insight Partners, Atlan is at the forefront of reimagining how humans and data work together. Joining us means becoming part of a movement to shape a future where data drives extraordinary outcomes.",
            spacing: { after: 400 },
          }),

          // Position Overview
          new Paragraph({
            text: "Position Overview",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: sections.overview,
            spacing: { after: 400 },
          }),

          // What will you do?
          new Paragraph({
            text: "What will you do? 🤔",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          // Responsibilities
          ...(Array.isArray(sections.responsibilities)
            ? sections.responsibilities.map(
                (item) =>
                  new Paragraph({
                    text: `• ${item}`,
                    spacing: { after: 100 },
                  }),
              )
            : [
                new Paragraph({
                  text: sections.responsibilities,
                  spacing: { after: 400 },
                }),
              ]),

          new Paragraph({ spacing: { after: 200 } }),

          // What makes you a great match for us?
          new Paragraph({
            text: "What makes you a great match for us? 😍",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          // Qualifications
          ...(Array.isArray(sections.qualifications)
            ? sections.qualifications.map(
                (item) =>
                  new Paragraph({
                    text: `• ${item}`,
                    spacing: { after: 100 },
                  }),
              )
            : [
                new Paragraph({
                  text: sections.qualifications,
                  spacing: { after: 400 },
                }),
              ]),

          new Paragraph({ spacing: { after: 200 } }),

          // Why Atlan for You?
          new Paragraph({
            text: "Why Atlan for You?",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "At Atlan, we believe the future belongs to the humans of data. From curing diseases to advancing space exploration, data teams are powering humanity's greatest achievements. Yet, working with data can be chaotic—our mission is to transform that experience. We're reimagining how data teams collaborate by building the home they deserve, enabling them to create winning data cultures and drive meaningful progress.",
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "Joining Atlan means:",
            spacing: { after: 100 },
          }),

          new Paragraph({
            text: "1. Ownership from Day One: Whether you're an intern or a full-time teammate, you'll own impactful projects, chart your growth, and collaborate with some of the best minds in the industry.",
            spacing: { after: 100 },
          }),

          new Paragraph({
            text: "2. Limitless Opportunities: At Atlan, your growth has no boundaries. If you're ready to take initiative, the sky's the limit.",
            spacing: { after: 100 },
          }),

          new Paragraph({
            text: "3. A Global Data Community: We're deeply embedded in the modern data stack, contributing to open-source projects, sponsoring meet-ups, and empowering team members to grow through conferences and learning opportunities.",
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "As a fast-growing, fully remote company trusted by global leaders like Cisco, Nasdaq, and HubSpot, we're creating a category-defining platform for data and AI governance. Backed by top investors, we've achieved 7X revenue growth in two years and are building a talented team spanning 15+ countries.",
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "If you're ready to do your life's best work and help shape the future of data collaboration, join Atlan and become part of a mission to empower the humans of data to achieve more, together.",
            spacing: { after: 400 },
          }),

          // Equal Opportunity Employer
          new Paragraph({
            text: "We are an equal opportunity employer",
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          }),

          new Paragraph({
            text: "At Atlan, we're committed to helping data teams do their lives' best work. We believe that diversity and authenticity are the cornerstones of innovation, and by embracing varied perspectives and experiences, we can create a workplace where everyone thrives. Atlan is proud to be an equal opportunity employer and does not discriminate based on race, color, religion, national origin, age, disability, sex, gender identity or expression, sexual orientation, marital status, military or veteran status, or any other characteristic protected by law.",
            spacing: { after: 200 },
          }),
        ],
      },
    ],
  })

  // Generate and return the document as a blob
  return await Packer.toBlob(doc)
}

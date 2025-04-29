"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { IntakeForm } from "@/components/intake-form"
import { JDOutput } from "@/components/jd-output"
import { JDAnalysis } from "@/components/jd-analysis"
import { JDRefinement } from "@/components/jd-refinement"
import { checkJDForBias } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import { useSearchParams } from "next/navigation"

export function JDAnalyzer() {
  const [activeStep, setActiveStep] = useState<number>(1)
  const [jdData, setJdData] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [templateData, setTemplateData] = useState<any>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Check for template parameter
  useEffect(() => {
    if (!searchParams) return

    const template = searchParams.get("template")
    if (template) {
      // In a real app, we would fetch template data from an API
      // For now, we'll just set some placeholder values based on the template name
      if (template === "data-engineer") {
        setTemplateData({
          title: "Data Engineer",
          department: "Data Engineering",
          outcomes: "Building scalable data pipelines and ensuring data quality",
          mindset: "Detail-oriented, problem-solving approach, and passion for data infrastructure",
          advantage: "Enabling data-driven decision making across the organization",
          decisions: "Balancing performance, cost, and maintainability in data systems",
        })
      } else if (template === "data-analyst") {
        setTemplateData({
          title: "Data Analyst",
          department: "Data Analytics",
          outcomes: "Delivering actionable insights and creating impactful visualizations",
          mindset: "Curiosity, analytical thinking, and business acumen",
          advantage: "Transforming raw data into strategic business insights",
          decisions: "Prioritizing analysis requests and determining appropriate methodologies",
        })
      } else if (template === "product-manager") {
        setTemplateData({
          title: "Product Manager",
          department: "Product",
          outcomes: "Delivering high-impact product features that solve user problems",
          mindset: "User-centric thinking, strategic vision, and execution focus",
          advantage: "Building products that create sustainable competitive advantage",
          decisions: "Balancing user needs, business goals, and technical constraints",
        })
      }

      if (templateData) {
        toast({
          title: "Template Loaded",
          description: `${templateData.title} template has been loaded. You can customize it further.`,
        })
      }
    }
  }, [searchParams, toast, templateData])

  const handleIntakeSubmit = (data: any) => {
    setIsAnalyzing(true)
    setJdData(data)
    setIsAnalyzing(false)
    setActiveStep(2)
  }

  const handleRefinementComplete = async (refinedData: any) => {
    setIsAnalyzing(true)

    try {
      // Get all content as a single string for bias checking
      const allContent = Object.values(refinedData.sections)
        .map((section) => {
          if (Array.isArray(section)) {
            return section.join(" ")
          }
          return section
        })
        .join(" ")

      // Check for bias in the final content
      const biasResult = await checkJDForBias(allContent)

      if (biasResult.success) {
        // Update the JD data with the refined sections and any new bias flags
        setJdData({
          ...jdData,
          ...refinedData,
          biasFlags: biasResult.biasFlags,
        })
      } else {
        toast({
          title: "Warning",
          description: "Could not perform final bias check. You can still proceed with the JD.",
          variant: "default",
        })

        setJdData({
          ...jdData,
          ...refinedData,
        })
      }
    } catch (error) {
      console.error("Error during refinement completion:", error)
      toast({
        title: "Error",
        description: "An error occurred during final processing. You can still proceed with the JD.",
        variant: "destructive",
      })

      setJdData({
        ...jdData,
        ...refinedData,
      })
    } finally {
      setIsAnalyzing(false)
      setActiveStep(3)
    }
  }

  const handleDownload = () => {
    // Create a formatted text version of the JD
    const { title, department, sections } = jdData

    let jdText = `# ${title}\n`
    jdText += `## ${department}\n\n`

    // Static Introduction
    jdText += `Data is at the core of modern business, yet many teams struggle with its overwhelming volume and complexity. At Atlan, we're changing that. As the world's first active metadata platform, we help organisations transform data chaos into clarity and seamless collaboration.\n\n`

    jdText += `From Fortune 500 leaders to hyper-growth startups, from automotive innovators redefining mobility to healthcare organisations saving lives, and from Wall Street powerhouses to Silicon Valley trailblazers — we empower ambitious teams across industries to unlock the full potential of their data.\n\n`

    jdText += `Recognised as leaders by Gartner and Forrester and backed by Insight Partners, Atlan is at the forefront of reimagining how humans and data work together. Joining us means becoming part of a movement to shape a future where data drives extraordinary outcomes.\n\n`

    // Position Overview
    jdText += `## Position Overview\n${sections.overview}\n\n`

    // What will you do?
    jdText += `## What will you do? 🤔\n`
    if (Array.isArray(sections.responsibilities)) {
      sections.responsibilities.forEach((item) => {
        jdText += `- ${item}\n`
      })
    } else {
      jdText += sections.responsibilities
    }
    jdText += "\n\n"

    // What makes you a great match for us?
    jdText += `## What makes you a great match for us? 😍\n`
    if (Array.isArray(sections.qualifications)) {
      sections.qualifications.forEach((item) => {
        jdText += `- ${item}\n`
      })
    } else {
      jdText += sections.qualifications
    }
    jdText += "\n\n"

    // Why Atlan for You?
    jdText += `## Why Atlan for You?\n`
    jdText += `At Atlan, we believe the future belongs to the humans of data. From curing diseases to advancing space exploration, data teams are powering humanity's greatest achievements. Yet, working with data can be chaotic—our mission is to transform that experience. We're reimagining how data teams collaborate by building the home they deserve, enabling them to create winning data cultures and drive meaningful progress.\n\n`

    jdText += `Joining Atlan means:\n`
    jdText += `1. Ownership from Day One: Whether you're an intern or a full-time teammate, you'll own impactful projects, chart your growth, and collaborate with some of the best minds in the industry.\n`
    jdText += `2. Limitless Opportunities: At Atlan, your growth has no boundaries. If you're ready to take initiative, the sky's the limit.\n`
    jdText += `3. A Global Data Community: We're deeply embedded in the modern data stack, contributing to open-source projects, sponsoring meet-ups, and empowering team members to grow through conferences and learning opportunities.\n\n`

    jdText += `As a fast-growing, fully remote company trusted by global leaders like Cisco, Nasdaq, and HubSpot, we're creating a category-defining platform for data and AI governance. Backed by top investors, we've achieved 7X revenue growth in two years and are building a talented team spanning 15+ countries.\n\n`

    jdText += `If you're ready to do your life's best work and help shape the future of data collaboration, join Atlan and become part of a mission to empower the humans of data to achieve more, together.\n\n`

    // Equal Opportunity Employer
    jdText += `## We are an equal opportunity employer\n`
    jdText += `At Atlan, we're committed to helping data teams do their lives' best work. We believe that diversity and authenticity are the cornerstones of innovation, and by embracing varied perspectives and experiences, we can create a workplace where everyone thrives. Atlan is proud to be an equal opportunity employer and does not discriminate based on race, color, religion, national origin, age, disability, sex, gender identity or expression, sexual orientation, marital status, military or veteran status, or any other characteristic protected by law.\n`

    // Create a blob and download
    const blob = new Blob([jdText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}-job-description.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Success",
      description: "Job description downloaded successfully!",
      variant: "default",
    })
  }

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-slate-800">
            {activeStep === 1
              ? "Step 1: Role Information"
              : activeStep === 2
                ? "Step 2: Analysis & Refinement"
                : "Step 3: Final Job Description"}
          </h2>
          <div className="flex items-center">
            <div className={`flex items-center ${activeStep >= 1 ? "text-atlan-primary" : "text-slate-400"}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 border-current">
                1
              </div>
              <span className="hidden md:inline">Intake</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-200 mx-1"></div>
            <div className={`flex items-center ${activeStep >= 2 ? "text-atlan-primary" : "text-slate-400"}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 border-current">
                2
              </div>
              <span className="hidden md:inline">Analysis</span>
            </div>
            <div className="w-8 h-0.5 bg-slate-200 mx-1"></div>
            <div className={`flex items-center ${activeStep >= 3 ? "text-atlan-primary" : "text-slate-400"}`}>
              <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 border-current">
                3
              </div>
              <span className="hidden md:inline">Final JD</span>
            </div>
          </div>
        </div>
      </div>

      {activeStep === 1 && (
        <IntakeForm onSubmit={handleIntakeSubmit} isLoading={isAnalyzing} initialData={templateData} />
      )}

      {activeStep === 2 && jdData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <JDAnalysis data={jdData} />
          </div>
          <div className="lg:col-span-2">
            <JDRefinement data={jdData} onComplete={handleRefinementComplete} />
          </div>
        </div>
      )}

      {activeStep === 3 && jdData && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-atlan-primary">Final Job Description</h3>
            <Button onClick={handleDownload} className="bg-atlan-primary hover:bg-atlan-primary-dark">
              <Download className="mr-2 h-4 w-4" />
              Download JD
            </Button>
          </div>
          <JDOutput data={jdData} />
        </div>
      )}
    </div>
  )
}

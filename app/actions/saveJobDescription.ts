"use server"

import { JDService } from "@/lib/jd-service"
import { getCurrentUser } from "@/app/actions/auth-actions"

export async function saveJobDescription(formData: FormData) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.email) {
      return { success: false, error: "You must be logged in to save a job description" }
    }

    const title = formData.get("title") as string
    const company = formData.get("company") as string
    const department = formData.get("department") as string
    const location = formData.get("location") as string
    const jobType = formData.get("jobType") as string
    const experienceLevel = formData.get("experienceLevel") as string
    const description = formData.get("description") as string
    const requirements = formData.get("requirements") as string
    const responsibilities = formData.get("responsibilities") as string
    const benefits = formData.get("benefits") as string

    const jdData = {
      title,
      company,
      department,
      location,
      job_type: jobType,
      experience_level: experienceLevel,
      description,
      requirements,
      responsibilities,
      benefits,
    }

    const result = await JDService.createJD(jdData, user.email)

    if (!result) {
      return { success: false, error: "Failed to save job description" }
    }

    // Track user activity
    await JDService.trackUserActivity(user.email, "create_jd", `Created job description: ${title}`)

    return { success: true, id: result.id }
  } catch (error) {
    console.error("Save job description error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

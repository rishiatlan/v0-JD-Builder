"use server"

import { JDService } from "@/lib/jd-service"
import { getCurrentUser } from "@/app/actions/auth-actions"

export async function deleteJobDescription(id: string) {
  try {
    const user = await getCurrentUser()

    if (!user || !user.email) {
      return { success: false, error: "You must be logged in to delete a job description" }
    }

    // Get the JD to check ownership
    const jd = await JDService.getJDById(id)

    if (!jd) {
      return { success: false, error: "Job description not found" }
    }

    // Check if the user owns this JD
    if (jd.created_by_email && jd.created_by_email !== user.email) {
      return { success: false, error: "You don't have permission to delete this job description" }
    }

    const success = await JDService.deleteJD(id)

    if (!success) {
      return { success: false, error: "Failed to delete job description" }
    }

    // Track user activity
    await JDService.trackUserActivity(user.email, "delete_jd", `Deleted job description with ID: ${id}`)

    return { success: true }
  } catch (error) {
    console.error("Delete job description error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

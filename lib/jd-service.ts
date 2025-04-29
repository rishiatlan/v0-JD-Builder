import { supabase } from "@/lib/supabase"
import { ErrorTracker } from "@/lib/error-tracking"

export interface JDData {
  id?: string
  title: string
  department: string
  content: any
  user_email?: string
  is_template?: boolean
  is_public?: boolean
  status?: string
}

export class JDService {
  static async saveJD(jdData: JDData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Prepare JD data
      const jdToSave = {
        title: jdData.title,
        department: jdData.department,
        content: jdData.content,
        user_email: jdData.user_email || null,
        is_template: jdData.is_template || false,
        is_public: jdData.is_public || false,
        status: jdData.status || "draft",
        updated_at: new Date().toISOString(),
      }

      let result

      // Update existing JD or create new one
      if (jdData.id) {
        result = await supabase.from("job_descriptions").update(jdToSave).eq("id", jdData.id).select()
      } else {
        result = await supabase
          .from("job_descriptions")
          .insert({
            ...jdToSave,
            created_at: new Date().toISOString(),
          })
          .select()
      }

      if (result.error) {
        throw result.error
      }

      // Log the action in user history
      await this.logUserAction(
        jdData.user_email,
        jdData.id ? "update" : "create",
        "job_description",
        result.data?.[0]?.id,
        {
          title: jdData.title,
        },
      )

      return { success: true, data: result.data?.[0] }
    } catch (error) {
      ErrorTracker.captureError(error, { action: "saveJD", jdData })
      return { success: false, error: error.message || "Failed to save job description" }
    }
  }

  static async getJD(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.from("job_descriptions").select("*").eq("id", id).single()

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      ErrorTracker.captureError(error, { action: "getJD", id })
      return { success: false, error: error.message || "Failed to retrieve job description" }
    }
  }

  static async getAllJDs(limit = 30): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("job_descriptions")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      ErrorTracker.captureError(error, { action: "getAllJDs" })
      return { success: false, error: error.message || "Failed to retrieve job descriptions" }
    }
  }

  static async deleteJD(id: string, userEmail?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get JD details before deletion for history
      const { data: jdData } = await supabase.from("job_descriptions").select("title, user_email").eq("id", id).single()

      // If user email is provided, verify ownership
      if (userEmail && jdData && jdData.user_email !== userEmail) {
        return { success: false, error: "You do not have permission to delete this job description" }
      }

      const { error } = await supabase.from("job_descriptions").delete().eq("id", id)

      if (error) {
        throw error
      }

      // Log the delete action
      await this.logUserAction(userEmail, "delete", "job_description", id, { title: jdData?.title })

      return { success: true }
    } catch (error) {
      ErrorTracker.captureError(error, { action: "deleteJD", id })
      return { success: false, error: error.message || "Failed to delete job description" }
    }
  }

  static async getTemplates(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.from("job_descriptions").select("*").eq("is_template", true)

      if (error) {
        throw error
      }

      return { success: true, data }
    } catch (error) {
      ErrorTracker.captureError(error, { action: "getTemplates" })
      return { success: false, error: error.message || "Failed to retrieve templates" }
    }
  }

  private static async logUserAction(
    userEmail: string | undefined | null,
    action: string,
    resourceType: string,
    resourceId: string | null,
    metadata: Record<string, any> | null,
  ): Promise<void> {
    try {
      await supabase.from("user_history").insert({
        user_email: userEmail || null,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to log user action:", error)
      // Don't throw here to prevent disrupting the main operation
    }
  }
}

import { getSupabaseAdmin, supabase } from "@/lib/supabase"

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
      const now = new Date().toISOString()
      const supabaseAdmin = getSupabaseAdmin()

      let result

      // Update existing JD or create new one
      if (jdData.id) {
        const { data, error } = await supabaseAdmin
          .from("job_descriptions")
          .update({
            title: jdData.title,
            department: jdData.department,
            content: jdData.content,
            user_email: jdData.user_email || null,
            is_template: jdData.is_template || false,
            is_public: jdData.is_public || false,
            status: jdData.status || "draft",
            updated_at: now,
          })
          .eq("id", jdData.id)
          .select()
          .single()

        if (error) throw error
        result = data
      } else {
        const { data, error } = await supabaseAdmin
          .from("job_descriptions")
          .insert({
            title: jdData.title,
            department: jdData.department,
            content: jdData.content,
            user_email: jdData.user_email || null,
            is_template: jdData.is_template || false,
            is_public: jdData.is_public || false,
            status: jdData.status || "draft",
            created_at: now,
            updated_at: now,
          })
          .select()
          .single()

        if (error) throw error
        result = data
      }

      // Log the action in user history
      await this.logUserAction(jdData.user_email, jdData.id ? "update" : "create", "job_description", result?.id, {
        title: jdData.title,
      })

      return { success: true, data: result }
    } catch (error) {
      console.error("Error saving JD:", error)
      return { success: false, error: error.message || "Failed to save job description" }
    }
  }

  static async getJD(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase.from("job_descriptions").select("*").eq("id", id).single()

      if (error) {
        return { success: false, error: "Job description not found" }
      }

      return { success: true, data }
    } catch (error) {
      console.error("Error getting JD:", error)
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

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error("Error getting all JDs:", error)
      return { success: false, error: error.message || "Failed to retrieve job descriptions" }
    }
  }

  static async getUserJDs(userEmail: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("job_descriptions")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false })

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error("Error getting user JDs:", error)
      return { success: false, error: error.message || "Failed to retrieve user job descriptions" }
    }
  }

  static async deleteJD(id: string, userEmail?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get JD details before deletion for history
      const { data: jdData, error: getError } = await supabase
        .from("job_descriptions")
        .select("title, user_email")
        .eq("id", id)
        .single()

      if (getError) {
        return { success: false, error: "Job description not found" }
      }

      // If user email is provided, verify ownership
      if (userEmail && jdData.user_email !== userEmail) {
        return { success: false, error: "You do not have permission to delete this job description" }
      }

      const supabaseAdmin = getSupabaseAdmin()
      const { error: deleteError } = await supabaseAdmin.from("job_descriptions").delete().eq("id", id)

      if (deleteError) throw deleteError

      // Log the delete action
      await this.logUserAction(userEmail, "delete", "job_description", id, { title: jdData?.title })

      return { success: true }
    } catch (error) {
      console.error("Error deleting JD:", error)
      return { success: false, error: error.message || "Failed to delete job description" }
    }
  }

  static async getTemplates(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.from("job_descriptions").select("*").eq("is_template", true)

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error("Error getting templates:", error)
      return { success: false, error: error.message || "Failed to retrieve templates" }
    }
  }

  static async getUserHistory(userEmail: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("user_history")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error("Error getting user history:", error)
      return { success: false, error: error.message || "Failed to retrieve user history" }
    }
  }

  static async getAllHistory(limit = 50): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { data, error } = await supabaseAdmin.rpc("get_history_with_names", { limit_count: limit })

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error("Error getting all history:", error)
      return { success: false, error: error.message || "Failed to retrieve history" }
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
      const supabaseAdmin = getSupabaseAdmin()
      const { error } = await supabaseAdmin.from("user_history").insert({
        user_email: userEmail || null,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        metadata,
        created_at: new Date().toISOString(),
      })

      if (error) throw error
    } catch (error) {
      console.error("Failed to log user action:", error)
      // Don't throw here to prevent disrupting the main operation
    }
  }
}

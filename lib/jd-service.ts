import { supabase } from "@/lib/supabase"
import { getAllHistory } from "@/app/actions/getAllHistory"

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
  // This method is now handled by the server action
  // Keeping it here for backward compatibility
  static async saveJD(jdData: JDData): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Forward to the server action
      const response = await fetch("/api/jd/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(jdData),
      })

      const result = await response.json()
      return result
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
      // This operation should be done through a server action
      // For now, we'll use the API route
      const response = await fetch(`/api/jd/delete?id=${id}&email=${userEmail || ""}`, {
        method: "DELETE",
      })

      const result = await response.json()
      return result
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
      // Use the server action
      const result = await getAllHistory(limit)
      return result
    } catch (error) {
      console.error("Error getting all history:", error)
      return { success: false, error: error.message || "Failed to retrieve history" }
    }
  }
}

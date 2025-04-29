import { supabase } from "@/lib/supabase"
import { getAllHistory } from "@/app/actions/getAllHistory"
import { createClient } from "@supabase/supabase-js"

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
  static async getUserJDs(email: string) {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      const { data, error } = await supabase
        .from("job_descriptions")
        .select("*")
        .eq("created_by_email", email)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching user JDs:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error: any) {
      console.error("Error in getUserJDs:", error)
      return { success: false, error: error.message }
    }
  }

  static async getAllJDs() {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      )

      const { data, error } = await supabase
        .from("job_descriptions")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching all JDs:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error: any) {
      console.error("Error in getAllJDs:", error)
      return { success: false, error: error.message }
    }
  }

  static async getUserHistory(email: string) {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      const { data, error } = await supabase
        .from("user_activity")
        .select("*")
        .eq("user_email", email)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Error fetching user history:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error: any) {
      console.error("Error in getUserHistory:", error)
      return { success: false, error: error.message }
    }
  }

  static async getAllHistory() {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      const { data, error } = await supabase
        .from("user_activity")
        .select("*, users(full_name)")
        .order("created_at", { ascending: false })
        .limit(100)

      if (error) {
        console.error("Error fetching all history:", error)
        return { success: false, error: error.message }
      }

      // Format the data to include the user's full name
      const formattedData = data.map((item) => ({
        ...item,
        full_name: item.users?.full_name || null,
      }))

      return { success: true, data: formattedData }
    } catch (error: any) {
      console.error("Error in getAllHistory:", error)
      return { success: false, error: error.message }
    }
  }

  static async deleteJD(id: string, userEmail: string) {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      // First check if the user owns this JD
      const { data: jdData, error: jdError } = await supabase
        .from("job_descriptions")
        .select("*")
        .eq("id", id)
        .eq("created_by_email", userEmail)
        .single()

      if (jdError || !jdData) {
        console.error("Error verifying JD ownership:", jdError)
        return { success: false, error: "You don't have permission to delete this job description" }
      }

      // If the user owns the JD, delete it
      const { error } = await supabase.from("job_descriptions").delete().eq("id", id)

      if (error) {
        console.error("Error deleting JD:", error)
        return { success: false, error: error.message }
      }

      // Log the activity
      await supabase.from("user_activity").insert([
        {
          user_email: userEmail,
          action: "delete",
          resource_type: "job_description",
          resource_id: id,
          metadata: { title: jdData.title },
        },
      ])

      return { success: true }
    } catch (error: any) {
      console.error("Error in deleteJD:", error)
      return { success: false, error: error.message }
    }
  }

  static async getJDById(id: string) {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      const { data, error } = await supabase.from("job_descriptions").select("*").eq("id", id).single()

      if (error) {
        console.error("Error fetching JD by ID:", error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error: any) {
      console.error("Error in getJDById:", error)
      return { success: false, error: error.message }
    }
  }

  static async saveJD(jdData: any, userEmail: string) {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      // Add the user email to the JD data
      const dataToSave = {
        ...jdData,
        created_by_email: userEmail,
      }

      const { data, error } = await supabase.from("job_descriptions").insert([dataToSave]).select()

      if (error) {
        console.error("Error saving JD:", error)
        return { success: false, error: error.message }
      }

      // Log the activity
      await supabase.from("user_activity").insert([
        {
          user_email: userEmail,
          action: "create",
          resource_type: "job_description",
          resource_id: data[0].id,
          metadata: { title: jdData.title },
        },
      ])

      return { success: true, data: data[0] }
    } catch (error: any) {
      console.error("Error in saveJD:", error)
      return { success: false, error: error.message }
    }
  }

  static async updateJD(id: string, jdData: any, userEmail: string) {
    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      // First check if the user owns this JD
      const { data: jdData, error: jdError } = await supabase
        .from("job_descriptions")
        .select("*")
        .eq("id", id)
        .eq("created_by_email", userEmail)
        .single()

      if (jdError || !jdData) {
        console.error("Error verifying JD ownership:", jdError)
        return { success: false, error: "You don't have permission to update this job description" }
      }

      // If the user owns the JD, update it
      const { data, error } = await supabase.from("job_descriptions").update(jdData).eq("id", id).select()

      if (error) {
        console.error("Error updating JD:", error)
        return { success: false, error: error.message }
      }

      // Log the activity
      await supabase.from("user_activity").insert([
        {
          user_email: userEmail,
          action: "update",
          resource_type: "job_description",
          resource_id: id,
          metadata: { title: jdData.title },
        },
      ])

      return { success: true, data: data[0] }
    } catch (error: any) {
      console.error("Error in updateJD:", error)
      return { success: false, error: error.message }
    }
  }

  // This method is now handled by the server action
  // Keeping it here for backward compatibility
  static async saveJD_old(jdData: JDData): Promise<{ success: boolean; data?: any; error?: string }> {
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

  static async getAllJDs_old(limit = 30): Promise<{ success: boolean; data?: any[]; error?: string }> {
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

  static async getUserJDs_old(userEmail: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
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

  static async deleteJD_old(id: string, userEmail?: string): Promise<{ success: boolean; error?: string }> {
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

  static async getUserHistory_old(userEmail: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
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

  static async getAllHistory_old(limit = 50): Promise<{ success: boolean; data?: any[]; error?: string }> {
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

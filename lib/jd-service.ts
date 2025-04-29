import { supabase } from "@/lib/supabase"

export interface JobDescription {
  id: string
  title: string
  company?: string
  department?: string
  location?: string
  job_type?: string
  experience_level?: string
  description?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  created_by_email: string
  created_at: string
  updated_at: string
}

export class JDService {
  static async createJD(jdData: Partial<JobDescription>, userEmail: string): Promise<JobDescription | null> {
    try {
      const { data, error } = await supabase
        .from("job_descriptions")
        .insert({
          ...jdData,
          created_by_email: userEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating JD:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in createJD:", error)
      return null
    }
  }

  static async getJDById(id: string): Promise<JobDescription | null> {
    try {
      const { data, error } = await supabase.from("job_descriptions").select("*").eq("id", id).single()

      if (error) {
        console.error("Error getting JD by ID:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in getJDById:", error)
      return null
    }
  }

  static async getJDsByEmail(email: string): Promise<JobDescription[]> {
    try {
      const { data, error } = await supabase
        .from("job_descriptions")
        .select("*")
        .eq("created_by_email", email)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error getting JDs by email:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getJDsByEmail:", error)
      return []
    }
  }

  static async getAllJDs(): Promise<JobDescription[]> {
    try {
      const { data, error } = await supabase
        .from("job_descriptions")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error getting all JDs:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Error in getAllJDs:", error)
      return []
    }
  }

  static async updateJD(id: string, jdData: Partial<JobDescription>): Promise<JobDescription | null> {
    try {
      const { data, error } = await supabase
        .from("job_descriptions")
        .update({
          ...jdData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating JD:", error)
        return null
      }

      return data
    } catch (error) {
      console.error("Error in updateJD:", error)
      return null
    }
  }

  static async deleteJD(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("job_descriptions").delete().eq("id", id)

      if (error) {
        console.error("Error deleting JD:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in deleteJD:", error)
      return false
    }
  }

  static async trackUserActivity(userEmail: string, action: string, details: string): Promise<boolean> {
    try {
      const { error } = await supabase.from("user_activity").insert({
        user_email: userEmail,
        action,
        details,
        created_at: new Date().toISOString(),
      })

      if (error) {
        console.error("Error tracking user activity:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error in trackUserActivity:", error)
      return false
    }
  }
}

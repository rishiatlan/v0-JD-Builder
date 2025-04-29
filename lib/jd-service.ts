import { query } from "@/lib/db"

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

      let result

      // Update existing JD or create new one
      if (jdData.id) {
        const updateQuery = `
          UPDATE job_descriptions 
          SET 
            title = $1, 
            department = $2, 
            content = $3, 
            user_email = $4, 
            is_template = $5, 
            is_public = $6, 
            status = $7, 
            updated_at = $8
          WHERE id = $9
          RETURNING *
        `

        result = await query(updateQuery, [
          jdData.title,
          jdData.department,
          JSON.stringify(jdData.content),
          jdData.user_email || null,
          jdData.is_template || false,
          jdData.is_public || false,
          jdData.status || "draft",
          now,
          jdData.id,
        ])
      } else {
        const insertQuery = `
          INSERT INTO job_descriptions (
            title, 
            department, 
            content, 
            user_email, 
            is_template, 
            is_public, 
            status, 
            created_at, 
            updated_at
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `

        result = await query(insertQuery, [
          jdData.title,
          jdData.department,
          JSON.stringify(jdData.content),
          jdData.user_email || null,
          jdData.is_template || false,
          jdData.is_public || false,
          jdData.status || "draft",
          now,
          now,
        ])
      }

      // Log the action in user history
      await this.logUserAction(jdData.user_email, jdData.id ? "update" : "create", "job_description", result[0]?.id, {
        title: jdData.title,
      })

      return { success: true, data: result[0] }
    } catch (error) {
      console.error("Error saving JD:", error)
      return { success: false, error: error.message || "Failed to save job description" }
    }
  }

  static async getJD(id: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const selectQuery = `
        SELECT * FROM job_descriptions 
        WHERE id = $1
      `

      const result = await query(selectQuery, [id])

      if (result.length === 0) {
        return { success: false, error: "Job description not found" }
      }

      return { success: true, data: result[0] }
    } catch (error) {
      console.error("Error getting JD:", error)
      return { success: false, error: error.message || "Failed to retrieve job description" }
    }
  }

  static async getAllJDs(limit = 30): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const selectQuery = `
        SELECT * FROM job_descriptions 
        WHERE is_public = true 
        ORDER BY created_at DESC 
        LIMIT $1
      `

      const result = await query(selectQuery, [limit])

      return { success: true, data: result }
    } catch (error) {
      console.error("Error getting all JDs:", error)
      return { success: false, error: error.message || "Failed to retrieve job descriptions" }
    }
  }

  static async getUserJDs(userEmail: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const selectQuery = `
        SELECT * FROM job_descriptions 
        WHERE user_email = $1 
        ORDER BY created_at DESC
      `

      const result = await query(selectQuery, [userEmail])

      return { success: true, data: result }
    } catch (error) {
      console.error("Error getting user JDs:", error)
      return { success: false, error: error.message || "Failed to retrieve user job descriptions" }
    }
  }

  static async deleteJD(id: string, userEmail?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get JD details before deletion for history
      const selectQuery = `
        SELECT title, user_email FROM job_descriptions 
        WHERE id = $1
      `

      const jdData = await query(selectQuery, [id])

      if (jdData.length === 0) {
        return { success: false, error: "Job description not found" }
      }

      // If user email is provided, verify ownership
      if (userEmail && jdData[0].user_email !== userEmail) {
        return { success: false, error: "You do not have permission to delete this job description" }
      }

      const deleteQuery = `
        DELETE FROM job_descriptions 
        WHERE id = $1
      `

      await query(deleteQuery, [id])

      // Log the delete action
      await this.logUserAction(userEmail, "delete", "job_description", id, { title: jdData[0]?.title })

      return { success: true }
    } catch (error) {
      console.error("Error deleting JD:", error)
      return { success: false, error: error.message || "Failed to delete job description" }
    }
  }

  static async getTemplates(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const selectQuery = `
        SELECT * FROM job_descriptions 
        WHERE is_template = true
      `

      const result = await query(selectQuery)

      return { success: true, data: result }
    } catch (error) {
      console.error("Error getting templates:", error)
      return { success: false, error: error.message || "Failed to retrieve templates" }
    }
  }

  static async getUserHistory(userEmail: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const selectQuery = `
        SELECT * FROM user_history 
        WHERE user_email = $1 
        ORDER BY created_at DESC 
        LIMIT 50
      `

      const result = await query(selectQuery, [userEmail])

      return { success: true, data: result }
    } catch (error) {
      console.error("Error getting user history:", error)
      return { success: false, error: error.message || "Failed to retrieve user history" }
    }
  }

  static async getAllHistory(limit = 50): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const selectQuery = `
        SELECT h.*, p.full_name 
        FROM user_history h
        LEFT JOIN user_profiles p ON h.user_email = p.email
        ORDER BY h.created_at DESC 
        LIMIT $1
      `

      const result = await query(selectQuery, [limit])

      return { success: true, data: result }
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
      const insertQuery = `
        INSERT INTO user_history (
          user_email, 
          action, 
          resource_type, 
          resource_id, 
          metadata, 
          created_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `

      await query(insertQuery, [
        userEmail || null,
        action,
        resourceType,
        resourceId,
        metadata ? JSON.stringify(metadata) : null,
        new Date().toISOString(),
      ])
    } catch (error) {
      console.error("Failed to log user action:", error)
      // Don't throw here to prevent disrupting the main operation
    }
  }
}

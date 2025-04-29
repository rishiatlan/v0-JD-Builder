"use server"

import { getSupabaseAdmin } from "@/lib/supabase"

export async function getAllHistory(limit = 50) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin.rpc("get_history_with_names", { limit_count: limit })

    if (error) throw error

    return { success: true, history: data }
  } catch (error) {
    console.error("Error getting all history:", error)
    return { success: false, error: error.message || "Failed to retrieve history" }
  }
}

export async function saveJDAdmin(jdData: any) {
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
    await logUserActionAdmin(jdData.user_email, jdData.id ? "update" : "create", "job_description", result?.id, {
      title: jdData.title,
    })

    return { success: true, data: result }
  } catch (error) {
    console.error("Error saving JD:", error)
    return { success: false, error: error.message || "Failed to save job description" }
  }
}

async function logUserActionAdmin(
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

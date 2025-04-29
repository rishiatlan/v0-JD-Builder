"use server"

import { getSupabaseAdmin } from "@/lib/supabase"

export async function deleteJobDescription(id: string, userEmail?: string) {
  try {
    const supabaseAdmin = getSupabaseAdmin()

    // Get JD details before deletion for history
    const { data: jdData, error: getError } = await supabaseAdmin
      .from("job_descriptions")
      .select("title, user_email")
      .eq("id", id)
      .single()

    if (getError) {
      throw new Error("Job description not found")
    }

    // If user email is provided, verify ownership
    if (userEmail && jdData.user_email !== userEmail) {
      throw new Error("You do not have permission to delete this job description")
    }

    const { error: deleteError } = await supabaseAdmin.from("job_descriptions").delete().eq("id", id)

    if (deleteError) throw deleteError

    // Log the delete action
    await logUserAction(userEmail, "delete", "job_description", id, { title: jdData?.title })

    return { success: true }
  } catch (error) {
    console.error("Error deleting JD:", error)
    throw new Error(error.message || "Failed to delete job description")
  }
}

async function logUserAction(
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

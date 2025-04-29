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
    throw new Error(error.message || "Failed to retrieve history")
  }
}

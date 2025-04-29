import { getSupabaseAdmin } from "./supabase"

// Helper function to execute a query with error handling
export async function query<T>(queryText: string, params: any[] = []): Promise<T[]> {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      throw new Error("Supabase admin client not initialized")
    }

    // Use Supabase's rpc function to execute raw SQL queries
    const { data, error } = await supabaseAdmin.rpc("execute_sql", {
      query_text: queryText,
      query_params: params,
    })

    if (error) {
      throw error
    }

    return data as T[]
  } catch (error) {
    console.error("Database query error:", error)
    throw new Error(`Database query failed: ${error.message}`)
  }
}

// For direct SQL execution (similar to the previous neon function)
export async function sql(queryText: string, params: any[] = []) {
  return query(queryText, params)
}

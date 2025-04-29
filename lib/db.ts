import { neon } from "@neondatabase/serverless"

// Use the DATABASE_URL environment variable provided by Neon
export const sql = neon(process.env.DATABASE_URL!)

// Helper function to execute a query with error handling using tagged template literals
export async function query<T>(queryText: string, params: any[] = []): Promise<T[]> {
  try {
    // Convert to the correct tagged template syntax
    return (await sql.query(queryText, params)) as T[]
  } catch (error) {
    console.error("Database query error:", error)
    throw new Error(`Database query failed: ${error.message}`)
  }
}

import { neon } from "@neondatabase/serverless"

// Use the DATABASE_URL environment variable provided by Neon
export const sql = neon(process.env.DATABASE_URL!)

// Helper function to execute a query with error handling
export async function query<T>(queryText: string, params: any[] = []): Promise<T[]> {
  try {
    return (await sql(queryText, params)) as T[]
  } catch (error) {
    console.error("Database query error:", error)
    throw new Error(`Database query failed: ${error.message}`)
  }
}

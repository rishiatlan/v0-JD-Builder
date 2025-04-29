"use server"

import { sql } from "@/lib/db"

export async function checkDatabaseConnection() {
  try {
    // Simple query to check if the database is accessible
    const result = await sql?.query("SELECT 1 as check")
    return { success: true, message: "Database connection successful" }
  } catch (error) {
    console.error("Database connection check failed:", error)
    return {
      success: false,
      message: "Database connection failed",
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

"use server"

import { query } from "@/lib/db"
import fs from "fs"
import path from "path"

export async function setupDatabase() {
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), "db", "migrations", "update_for_magic_link.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    await query(migrationSQL)

    return { success: true }
  } catch (error) {
    console.error("Database setup error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Add the missing runMigration export
export async function runMigration(migrationFileName: string) {
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), "db", "migrations", migrationFileName)
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    await query(migrationSQL)

    return {
      success: true,
      message: `Successfully ran migration: ${migrationFileName}`,
    }
  } catch (error) {
    console.error(`Migration error (${migrationFileName}):`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      migrationFile: migrationFileName,
    }
  }
}

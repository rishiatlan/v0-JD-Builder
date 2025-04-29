"use server"

import { sql } from "@/lib/db"
import fs from "fs"
import path from "path"

export async function setupDatabase() {
  try {
    // Read the schema SQL files
    const schemaPath = path.join(process.cwd(), "db", "schema.sql")
    const sessionSchemaPath = path.join(process.cwd(), "db", "session-schema.sql")

    const schemaSql = fs.readFileSync(schemaPath, "utf8")
    const sessionSchemaSql = fs.readFileSync(sessionSchemaPath, "utf8")

    // Execute the schema SQL
    await sql(schemaSql)
    await sql(sessionSchemaSql)

    return { success: true, message: "Database setup completed successfully" }
  } catch (error) {
    console.error("Database setup error:", error)
    return {
      success: false,
      message: `Database setup failed: ${error.message}`,
    }
  }
}

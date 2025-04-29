"use server"

import { getSupabaseAdmin } from "@/lib/supabase"
import fs from "fs"
import path from "path"

export async function setupDatabase() {
  try {
    // Read the schema SQL files
    const schemaPath = path.join(process.cwd(), "db", "schema.sql")
    const sessionSchemaPath = path.join(process.cwd(), "db", "session-schema.sql")
    const supabaseSetupPath = path.join(process.cwd(), "db", "supabase-setup.sql")

    const schemaSql = fs.readFileSync(schemaPath, "utf8")
    const sessionSchemaSql = fs.readFileSync(sessionSchemaPath, "utf8")
    const supabaseSetupSql = fs.readFileSync(supabaseSetupPath, "utf8")

    // Get Supabase admin client
    const supabaseAdmin = getSupabaseAdmin()

    // Execute the schema SQL
    const { error: schemaError } = await supabaseAdmin.rpc("execute_sql", { query_text: schemaSql })
    if (schemaError) throw new Error(`Schema setup error: ${schemaError.message}`)

    const { error: sessionError } = await supabaseAdmin.rpc("execute_sql", { query_text: sessionSchemaSql })
    if (sessionError) throw new Error(`Session schema setup error: ${sessionError.message}`)

    const { error: supabaseSetupError } = await supabaseAdmin.rpc("execute_sql", { query_text: supabaseSetupSql })
    if (supabaseSetupError) throw new Error(`Supabase setup error: ${supabaseSetupError.message}`)

    return { success: true, message: "Database setup completed successfully" }
  } catch (error) {
    console.error("Database setup error:", error)
    return {
      success: false,
      message: `Database setup failed: ${error.message}`,
    }
  }
}

"use server"

import { createClient } from "@supabase/supabase-js"
import fs from "fs"
import path from "path"

export async function runMigration() {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), "db", "migrations", "add_password_reset.sql")
    const migrationSQL = fs.readFileSync(migrationPath, "utf8")

    // Execute the migration
    const { error } = await supabase.rpc("exec_sql", { sql: migrationSQL })

    if (error) {
      console.error("Migration error:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error running migration:", error)
    return { success: false, error: error.message }
  }
}

// Add the missing export
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
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    // Execute the schema SQL
    const { error: schemaError } = await supabase.rpc("exec_sql", { sql: schemaSql })
    if (schemaError) throw new Error(`Schema setup error: ${schemaError.message}`)

    const { error: sessionError } = await supabase.rpc("exec_sql", { sql: sessionSchemaSql })
    if (sessionError) throw new Error(`Session schema setup error: ${sessionError.message}`)

    const { error: supabaseSetupError } = await supabase.rpc("exec_sql", { sql: supabaseSetupSql })
    if (supabaseSetupError) throw new Error(`Supabase setup error: ${supabaseSetupError.message}`)

    return { success: true, message: "Database setup completed successfully" }
  } catch (error: any) {
    console.error("Database setup error:", error)
    return {
      success: false,
      message: `Database setup failed: ${error.message}`,
    }
  }
}

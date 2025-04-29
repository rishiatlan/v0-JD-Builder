const fs = require("fs")
const path = require("path")
const { neon } = require("@neondatabase/serverless")

async function main() {
  try {
    console.log("Setting up database...")

    // Read the database URL from environment variables
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      console.error("DATABASE_URL environment variable is not set")
      process.exit(1)
    }

    // Create a SQL client
    const sql = neon(databaseUrl)

    // Read the schema SQL files
    const schemaPath = path.join(__dirname, "..", "db", "schema.sql")
    const sessionSchemaPath = path.join(__dirname, "..", "db", "session-schema.sql")

    const schemaSql = fs.readFileSync(schemaPath, "utf8")

    // Execute the main schema SQL
    await sql(schemaSql)
    console.log("Main schema created successfully")

    try {
      // Try to read and execute the session schema
      const sessionSchemaSql = fs.readFileSync(sessionSchemaPath, "utf8")
      await sql(sessionSchemaSql)
      console.log("Session schema created successfully")
    } catch (sessionError) {
      console.error("Error setting up session schema:", sessionError)
    }

    console.log("Database setup completed successfully")
  } catch (error) {
    console.error("Error setting up database:", error)
    process.exit(1)
  }
}

// Run the script
main()

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

    // Read the schema SQL file
    const schemaPath = path.join(__dirname, "..", "db", "schema.sql")
    const schemaSql = fs.readFileSync(schemaPath, "utf8")

    // Execute the schema SQL
    await sql(schemaSql)

    console.log("Database setup completed successfully")
  } catch (error) {
    console.error("Error setting up database:", error)
    process.exit(1)
  }
}

// Run the script
main()

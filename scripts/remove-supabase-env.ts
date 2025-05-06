import fs from "fs"
import { promisify } from "util"

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const readdir = promisify(fs.readdir)

// Environment variable patterns to remove
const patterns = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"]

async function processEnvFile(filePath: string): Promise<void> {
  try {
    const content = await readFile(filePath, "utf8")
    const lines = content.split("\n")

    const filteredLines = lines.filter((line) => {
      // Keep lines that don't match any of our patterns
      return !patterns.some((pattern) => line.startsWith(pattern + "="))
    })

    // If we removed any lines, write the file back
    if (filteredLines.length !== lines.length) {
      await writeFile(filePath, filteredLines.join("\n"))
      console.log(`Updated ${filePath} - removed ${lines.length - filteredLines.length} Supabase variables`)
    } else {
      console.log(`No Supabase variables found in ${filePath}`)
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
  }
}

async function main() {
  try {
    // Find all .env files
    const envFiles = [
      ".env",
      ".env.local",
      ".env.development",
      ".env.development.local",
      ".env.production",
      ".env.production.local",
    ]

    for (const file of envFiles) {
      if (fs.existsSync(file)) {
        await processEnvFile(file)
      }
    }

    console.log("Finished processing environment files")
  } catch (error) {
    console.error("Error:", error)
  }
}

main()

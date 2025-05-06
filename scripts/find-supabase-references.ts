import fs from "fs"
import path from "path"
import { promisify } from "util"

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const stat = promisify(fs.stat)

// Patterns to search for
const patterns = [
  "@supabase/supabase-js",
  "createClient",
  "supabase",
  "SUPABASE_URL",
  "SUPABASE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
]

// File extensions to check
const extensions = [".ts", ".tsx", ".js", ".jsx", ".md"]

// Directories to exclude
const excludeDirs = ["node_modules", ".next", "out", "build", "dist"]

async function findReferences(dir: string, results: any[] = []): Promise<any[]> {
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (!excludeDirs.includes(entry.name)) {
        await findReferences(fullPath, results)
      }
      continue
    }

    const ext = path.extname(entry.name).toLowerCase()
    if (!extensions.includes(ext)) continue

    try {
      const content = await readFile(fullPath, "utf8")

      for (const pattern of patterns) {
        if (content.includes(pattern)) {
          const lines = content.split("\n")
          const matchingLines = lines
            .map((line, i) => ({ line, lineNumber: i + 1 }))
            .filter(({ line }) => line.includes(pattern))

          if (matchingLines.length > 0) {
            results.push({
              file: fullPath,
              pattern,
              matches: matchingLines.map(({ line, lineNumber }) => ({
                line: line.trim(),
                lineNumber,
              })),
            })
          }
        }
      }
    } catch (error) {
      console.error(`Error reading file ${fullPath}:`, error)
    }
  }

  return results
}

async function main() {
  try {
    const results = await findReferences(".")
    console.log(JSON.stringify(results, null, 2))
  } catch (error) {
    console.error("Error:", error)
  }
}

main()

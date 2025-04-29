// This is a script to find problematic imports
// You can run this locally with Node.js to find any issues

const fs = require("fs")
const path = require("path")

// Function to recursively search for files
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory() && !filePath.includes("node_modules") && !filePath.includes(".next")) {
      fileList = findFiles(filePath, fileList)
    } else if (
      stat.isFile() &&
      (filePath.endsWith(".js") || filePath.endsWith(".jsx") || filePath.endsWith(".ts") || filePath.endsWith(".tsx"))
    ) {
      fileList.push(filePath)
    }
  })

  return fileList
}

// Function to check for problematic imports
function checkImports(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  const lines = content.split("\n")

  const problematicLines = []

  lines.forEach((line, index) => {
    // Check for imports that look like URLs but aren't in Deno files
    if (
      !filePath.includes("supabase/functions") &&
      (line.includes("import") || line.includes("require")) &&
      (line.includes("http:") || line.includes("https:"))
    ) {
      problematicLines.push({
        line: index + 1,
        content: line.trim(),
      })
    }
  })

  if (problematicLines.length > 0) {
    console.log(`\nProblematic imports found in ${filePath}:`)
    problematicLines.forEach(({ line, content }) => {
      console.log(`  Line ${line}: ${content}`)
    })
  }
}

// Main function
function main() {
  console.log("Searching for problematic imports...")

  const files = findFiles(".")
  const problemFound = false

  files.forEach((file) => {
    try {
      checkImports(file)
    } catch (error) {
      console.error(`Error checking ${file}:`, error.message)
    }
  })

  console.log("\nSearch complete.")
}

main()

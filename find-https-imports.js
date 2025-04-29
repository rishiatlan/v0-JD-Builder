const fs = require("fs")
const path = require("path")

// Function to recursively search for files
function findFiles(dir) {
  let results = []
  const list = fs.readdirSync(dir)

  list.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory() && file !== "node_modules" && file !== ".next" && file !== ".git") {
      results = results.concat(findFiles(filePath))
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
      results.push(filePath)
    }
  })

  return results
}

// Function to check file for problematic imports
function checkFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  const lines = content.split("\n")

  const problematicLines = []

  lines.forEach((line, index) => {
    // Check for imports with https: that are not in Deno files
    if (
      !filePath.includes("supabase/functions") &&
      (line.includes("import") || line.includes("require")) &&
      line.includes("https:")
    ) {
      problematicLines.push({
        lineNumber: index + 1,
        content: line.trim(),
      })
    }
  })

  return problematicLines
}

// Main function
function main() {
  console.log("Searching for problematic https: imports...")

  try {
    const files = findFiles(".")
    let foundProblems = false

    files.forEach((file) => {
      const problems = checkFile(file)

      if (problems.length > 0) {
        console.log(`\nFile: ${file}`)
        problems.forEach((problem) => {
          console.log(`  Line ${problem.lineNumber}: ${problem.content}`)
        })
        foundProblems = true
      }
    })

    if (!foundProblems) {
      console.log("No problematic imports found.")
    }
  } catch (error) {
    console.error("Error:", error)
  }
}

main()

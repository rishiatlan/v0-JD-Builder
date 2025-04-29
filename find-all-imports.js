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

// Function to extract imports from a file
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, "utf8")
  const lines = content.split("\n")

  const imports = []

  lines.forEach((line, index) => {
    // Check for ES6 imports
    const importMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/)
    if (importMatch) {
      imports.push({
        type: "import",
        module: importMatch[1],
        line: index + 1,
        content: line.trim(),
      })
    }

    // Check for require statements
    const requireMatch = line.match(/require\s*$$\s*['"]([^'"]+)['"]\s*$$/)
    if (requireMatch) {
      imports.push({
        type: "require",
        module: requireMatch[1],
        line: index + 1,
        content: line.trim(),
      })
    }
  })

  return imports
}

// Main function
function main() {
  console.log("Analyzing imports in project files...")

  try {
    const files = findFiles(".")
    const allImports = []

    files.forEach((file) => {
      try {
        const imports = extractImports(file)
        if (imports.length > 0) {
          allImports.push({
            file,
            imports,
          })
        }
      } catch (error) {
        console.error(`Error processing ${file}:`, error.message)
      }
    })

    // Look for suspicious imports
    const suspiciousImports = []
    allImports.forEach(({ file, imports }) => {
      imports.forEach((imp) => {
        // Check for imports that end with a colon or contain URL-like patterns
        if (imp.module.endsWith(":") || (imp.module.includes("://") && !file.includes("supabase/functions"))) {
          suspiciousImports.push({
            file,
            ...imp,
          })
        }
      })
    })

    if (suspiciousImports.length > 0) {
      console.log("\nSuspicious imports found:")
      suspiciousImports.forEach((imp) => {
        console.log(`\nFile: ${imp.file}`)
        console.log(`Line ${imp.line}: ${imp.content}`)
        console.log(`Module: "${imp.module}"`)
      })
    } else {
      console.log("\nNo suspicious imports found.")
    }

    // Output summary
    console.log(`\nTotal files analyzed: ${files.length}`)
    console.log(`Total files with imports: ${allImports.length}`)
    console.log(`Total suspicious imports: ${suspiciousImports.length}`)
  } catch (error) {
    console.error("Error:", error)
  }
}

main()

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

// Function to find URL imports in a file
function findUrlImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8")
    const lines = content.split("\n")

    const results = []

    lines.forEach((line, index) => {
      // Check for ES6 imports with URLs
      const importMatch = line.match(/import\s+.*\s+from\s+['"]((https?:)?\/\/[^'"]+)['"]/)
      if (importMatch) {
        results.push({
          type: "import",
          url: importMatch[1],
          line: index + 1,
          content: line.trim(),
        })
      }

      // Check for require statements with URLs
      const requireMatch = line.match(/require\s*$$\s*['"]((https?:)?\/\/[^'"]+)['"]\s*$$/)
      if (requireMatch) {
        results.push({
          type: "require",
          url: requireMatch[1],
          line: index + 1,
          content: line.trim(),
        })
      }

      // Check for dynamic imports with URLs
      const dynamicImportMatch = line.match(/import\s*$$\s*['"]((https?:)?\/\/[^'"]+)['"]\s*$$/)
      if (dynamicImportMatch) {
        results.push({
          type: "dynamic import",
          url: dynamicImportMatch[1],
          line: index + 1,
          content: line.trim(),
        })
      }
    })

    return results
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message)
    return []
  }
}

// Main function
function main() {
  console.log("Searching for URL imports in JavaScript/TypeScript files...")

  try {
    const files = findFiles(".")
    console.log(`Found ${files.length} JS/TS files to scan`)

    const problematicFiles = []

    files.forEach((file) => {
      const urlImports = findUrlImports(file)
      if (urlImports.length > 0) {
        problematicFiles.push({
          file,
          urlImports,
        })
      }
    })

    console.log("\n=== URL IMPORTS REPORT ===\n")

    if (problematicFiles.length === 0) {
      console.log("No URL imports found in the codebase.")
    } else {
      console.log(`Found URL imports in ${problematicFiles.length} files:\n`)

      problematicFiles.forEach(({ file, urlImports }) => {
        console.log(`\nFile: ${file}`)
        urlImports.forEach(({ type, url, line, content }) => {
          console.log(`  Line ${line}: ${type} with URL "${url}"`)
          console.log(`    ${content}`)
        })
      })

      // Count total URL imports found
      const totalUrlImports = problematicFiles.reduce((count, { urlImports }) => count + urlImports.length, 0)
      console.log(`\nTotal URL imports found: ${totalUrlImports}`)
    }
  } catch (error) {
    console.error("Error:", error)
  }
}

main()

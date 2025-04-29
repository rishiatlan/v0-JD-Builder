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
    } else if (stat.isFile()) {
      // Skip binary files and very large files
      if (isBinaryOrLarge(filePath, stat)) {
        return
      }
      results.push(filePath)
    }
  })

  return results
}

// Check if file is binary or too large
function isBinaryOrLarge(filePath, stat) {
  // Skip files larger than 5MB
  if (stat.size > 5 * 1024 * 1024) {
    return true
  }

  // Skip binary file extensions
  const binaryExtensions = [".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".zip", ".tar", ".gz", ".exe"]
  if (binaryExtensions.some((ext) => filePath.toLowerCase().endsWith(ext))) {
    return true
  }

  return false
}

// Function to find "https:" string in a file
function findHttpsColon(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8")
    const lines = content.split("\n")

    const results = []

    lines.forEach((line, index) => {
      // Look for "https:" string that's not part of a URL
      // This regex looks for "https:" that's not followed by "//"
      const match = line.match(/https:(?!\/\/)/g)
      if (match) {
        results.push({
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
  console.log('Searching for problematic "https:" strings in the codebase...')

  try {
    const files = findFiles(".")
    console.log(`Found ${files.length} files to scan`)

    const problematicFiles = []

    files.forEach((file) => {
      const matches = findHttpsColon(file)
      if (matches.length > 0) {
        problematicFiles.push({
          file,
          matches,
        })
      }
    })

    console.log('\n=== PROBLEMATIC "https:" STRINGS REPORT ===\n')

    if (problematicFiles.length === 0) {
      console.log('No problematic "https:" strings found in the codebase.')
    } else {
      console.log(`Found problematic "https:" strings in ${problematicFiles.length} files:\n`)

      problematicFiles.forEach(({ file, matches }) => {
        console.log(`\nFile: ${file}`)
        matches.forEach(({ line, content }) => {
          console.log(`  Line ${line}: ${content}`)
        })
      })

      // Count total matches found
      const totalMatches = problematicFiles.reduce((count, { matches }) => count + matches.length, 0)
      console.log(`\nTotal problematic "https:" strings found: ${totalMatches}`)
    }
  } catch (error) {
    console.error("Error:", error)
  }
}

main()

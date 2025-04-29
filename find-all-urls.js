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

// Function to find URLs in a file
function findUrls(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8")
    const lines = content.split("\n")

    const urlResults = []

    // Regular expression to match URLs
    // This regex looks for http:// or https:// followed by any non-whitespace characters
    const urlRegex = /(https?:\/\/[^\s"'<>()[\]{}]+)/g

    lines.forEach((line, index) => {
      let match
      while ((match = urlRegex.exec(line)) !== null) {
        urlResults.push({
          url: match[0],
          line: index + 1,
          lineContent: line.trim(),
        })
      }
    })

    return urlResults
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message)
    return []
  }
}

// Main function
function main() {
  console.log("Searching for URLs in the codebase...")

  try {
    const files = findFiles(".")
    console.log(`Found ${files.length} files to scan`)

    const urlsFound = []

    files.forEach((file) => {
      const urls = findUrls(file)
      if (urls.length > 0) {
        urlsFound.push({
          file,
          urls,
        })
      }
    })

    console.log("\n=== URL REPORT ===\n")
    console.log(`Found URLs in ${urlsFound.length} files\n`)

    urlsFound.forEach(({ file, urls }) => {
      console.log(`\nFile: ${file}`)
      urls.forEach(({ url, line, lineContent }) => {
        console.log(`  Line ${line}: ${url}`)
        console.log(`    Context: ${lineContent}`)
      })
    })

    // Count total URLs found
    const totalUrls = urlsFound.reduce((count, { urls }) => count + urls.length, 0)
    console.log(`\nTotal URLs found: ${totalUrls}`)
  } catch (error) {
    console.error("Error:", error)
  }
}

main()

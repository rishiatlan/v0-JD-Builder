const fs = require("fs")
const path = require("path")

// Patterns to search for
const patterns = [
  { pattern: /from ['"].*\/lib\/auth-context['"]/, description: "auth-context import" },
  { pattern: /from ['"].*\/app\/actions\/auth-actions['"]/, description: "auth-actions import" },
  { pattern: /from ['"].*\/components\/protected-route['"]/, description: "protected-route import" },
  { pattern: /useAuth/, description: "useAuth reference" },
  { pattern: /signOut/, description: "signOut reference" },
  { pattern: /getCurrentUser/, description: "getCurrentUser reference" },
  { pattern: /ProtectedRoute/, description: "ProtectedRoute reference" },
  { pattern: /authState/, description: "authState reference" },
]

// Function to search for patterns in a file
function searchFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8")
    const matches = []

    patterns.forEach(({ pattern, description }) => {
      if (pattern.test(content)) {
        matches.push({ description, filePath })
      }
    })

    return matches
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error)
    return []
  }
}

// Function to recursively search directories
function searchDirectory(dir) {
  let results = []

  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (file !== "node_modules" && file !== ".next") {
        results = results.concat(searchDirectory(filePath))
      }
    } else if (
      stat.isFile() &&
      (file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".ts") || file.endsWith(".tsx"))
    ) {
      results = results.concat(searchFile(filePath))
    }
  }

  return results
}

// Start the search from the current directory
const matches = searchDirectory(".")

// Group results by file path
const groupedMatches = {}
matches.forEach((match) => {
  if (!groupedMatches[match.filePath]) {
    groupedMatches[match.filePath] = []
  }
  groupedMatches[match.filePath].push(match.description)
})

// Print results
console.log("Files with authentication references:")
Object.entries(groupedMatches).forEach(([filePath, descriptions]) => {
  console.log(`\n${filePath}:`)
  descriptions.forEach((desc) => console.log(`  - ${desc}`))
})

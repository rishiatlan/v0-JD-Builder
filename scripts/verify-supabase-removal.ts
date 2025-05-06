import fs from "fs"
import { promisify } from "util"
import { exec } from "child_process"

const readFile = promisify(fs.readFile)
const execPromise = promisify(exec)

async function checkPackageJson() {
  try {
    const packageJson = JSON.parse(await readFile("package.json", "utf8"))

    // Check dependencies
    const dependencies = packageJson.dependencies || {}
    const devDependencies = packageJson.devDependencies || {}

    const supabaseDeps = Object.keys(dependencies).filter((dep) => dep.includes("supabase"))
    const supabaseDevDeps = Object.keys(devDependencies).filter((dep) => dep.includes("supabase"))

    if (supabaseDeps.length > 0 || supabaseDevDeps.length > 0) {
      console.error("❌ Supabase dependencies still exist in package.json:")
      if (supabaseDeps.length > 0) console.error("  Dependencies:", supabaseDeps)
      if (supabaseDevDeps.length > 0) console.error("  DevDependencies:", supabaseDevDeps)
      return false
    }

    console.log("✅ No Supabase dependencies found in package.json")
    return true
  } catch (error) {
    console.error("Error checking package.json:", error)
    return false
  }
}

async function checkCodeReferences() {
  try {
    // Use grep to find any references to supabase in the codebase
    const { stdout } = await execPromise(
      'grep -r "supabase" --include="*.{ts,tsx,js,jsx}" . --exclude-dir={node_modules,.next,out,build,dist}',
    )

    if (stdout.trim()) {
      console.error("❌ Supabase references still exist in code:")
      console.error(stdout)
      return false
    }

    console.log("✅ No Supabase references found in code")
    return true
  } catch (error) {
    // grep returns exit code 1 if no matches found, which is what we want
    if (error.code === 1 && !error.stdout.trim()) {
      console.log("✅ No Supabase references found in code")
      return true
    }

    console.error("Error checking code references:", error)
    return false
  }
}

async function checkEnvVariables() {
  try {
    const envFiles = [
      ".env",
      ".env.local",
      ".env.development",
      ".env.development.local",
      ".env.production",
      ".env.production.local",
    ]

    let allClear = true

    for (const file of envFiles) {
      if (!fs.existsSync(file)) continue

      const content = await readFile(file, "utf8")
      const supabaseVars = content
        .split("\n")
        .filter((line) => line.includes("SUPABASE_") || line.includes("NEXT_PUBLIC_SUPABASE_"))

      if (supabaseVars.length > 0) {
        console.error(`❌ Supabase environment variables still exist in ${file}:`)
        console.error(supabaseVars.join("\n"))
        allClear = false
      } else {
        console.log(`✅ No Supabase environment variables found in ${file}`)
      }
    }

    return allClear
  } catch (error) {
    console.error("Error checking environment variables:", error)
    return false
  }
}

async function main() {
  console.log("🔍 Verifying Supabase removal...")

  const packageCheck = await checkPackageJson()
  const codeCheck = await checkCodeReferences()
  const envCheck = await checkEnvVariables()

  if (packageCheck && codeCheck && envCheck) {
    console.log("✅ Supabase has been successfully removed from the project!")
  } else {
    console.error("❌ Supabase removal is incomplete. Please address the issues above.")
  }
}

main()

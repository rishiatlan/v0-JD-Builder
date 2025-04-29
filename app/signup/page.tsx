export const dynamic = "force-dynamic"

import { AtlanHeader } from "@/components/atlan-header"
import { AtlanFooter } from "@/components/atlan-footer"
import { SignupForm } from "@/components/auth/signup-form"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function SignupPage() {
  try {
    // Check if user is already logged in
    const session = await getSession()

    if (session) {
      redirect("/")
    }

    return (
      <div className="min-h-screen flex flex-col bg-slate-50">
        <AtlanHeader />
        <main className="flex-1 container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center text-atlan-primary mb-8">Create an Account</h1>
          <div className="max-w-md mx-auto">
            <SignupForm />
          </div>
        </main>
        <AtlanFooter />
      </div>
    )
  } catch (error) {
    console.error("Signup page error:", error)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md w-full">
          <h2 className="text-lg font-semibold mb-2">Error Loading Signup Page</h2>
          <p>We encountered an issue loading the signup page. Please try again later.</p>
        </div>
        <a href="/" className="mt-4 text-blue-600 hover:underline">
          Return to Home
        </a>
      </div>
    )
  }
}

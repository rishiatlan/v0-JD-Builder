import { AtlanHeader } from "@/components/atlan-header"
import { AtlanFooter } from "@/components/atlan-footer"
import { SignupForm } from "@/components/auth/signup-form"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"

export default async function SignupPage() {
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
}

"use client"
import Link from "next/link"
import { EnhancedHeader } from "@/components/enhanced-header"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { LoginForm } from "@/components/auth/login-form"
import { motion } from "framer-motion"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <EnhancedHeader />

      <main className="flex-grow flex items-center justify-center py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                <p className="text-slate-600">Sign in to your account to continue</p>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-8">
                <LoginForm />
              </div>

              <div className="text-center mt-6">
                <p className="text-sm text-slate-600">
                  Don't have an account?{" "}
                  <Link href="/signup" className="text-primary hover:underline font-medium">
                    Create an account
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  )
}

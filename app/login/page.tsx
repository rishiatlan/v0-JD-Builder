"use client"
import { EnhancedHeader } from "@/components/enhanced-header"
import { EnhancedFooter } from "@/components/enhanced-footer"
import { MagicLinkForm } from "@/components/auth/magic-link-form"
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
                <h1 className="text-3xl font-bold mb-2">Welcome to Atlan JD Builder</h1>
                <p className="text-slate-600">Enter your @atlan.com email to continue</p>
              </div>

              <div className="bg-white rounded-xl shadow-soft p-8">
                <MagicLinkForm />
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <EnhancedFooter />
    </div>
  )
}

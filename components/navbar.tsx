"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="text-slate-800">
            <div className="w-8 h-8 bg-atlan-primary text-white flex items-center justify-center rounded-sm">N</div>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-slate-800 font-medium">
              JD Builder
            </Link>
            <Link href="/history" className="text-slate-600 hover:text-slate-800">
              History
            </Link>
            <Link href="/templates" className="text-slate-600 hover:text-slate-800">
              Templates
            </Link>
            <Link href="/repository" className="text-slate-600 hover:text-slate-800">
              Repository
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link href="/signin" className="text-slate-600 hover:text-slate-800">
            Sign In
          </Link>
          <Button
            className="bg-atlan-primary hover:bg-atlan-primary-dark text-white"
            onClick={() => {
              window.location.href = "/builder"
            }}
          >
            Create New JD
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

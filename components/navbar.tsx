"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const router = useRouter()

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
            <Link href="/standards" className="text-slate-600 hover:text-slate-800">
              JD Standards
            </Link>
            <Link
              href="https://github.com/rishiatlan/v0-JD-Builder/tree/main"
              className="text-slate-600 hover:text-slate-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              Repository
            </Link>
          </div>
        </div>

        <div className="flex items-center">
          <Button
            className="bg-atlan-primary hover:bg-atlan-primary-dark text-white"
            onClick={() => router.push("/builder")}
          >
            Create New JD
          </Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

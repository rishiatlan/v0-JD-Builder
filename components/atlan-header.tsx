"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"

export function AtlanHeader() {
  return (
    <header className="w-full bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <Image src="/images/atlan-logo.png" alt="Atlan Logo" width={120} height={40} className="h-10 w-auto" />
          </Link>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-slate-600 hover:text-atlan-primary font-medium">
            JD Builder
          </Link>
          <Link href="/history" className="text-slate-600 hover:text-atlan-primary font-medium">
            History
          </Link>
          <Link href="/templates" className="text-slate-600 hover:text-atlan-primary font-medium">
            Templates
          </Link>
          <a
            href="https://github.com/atlan-antfarm/jd-builder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-atlan-primary font-medium flex items-center"
          >
            <Github className="h-4 w-4 mr-1" />
            Repository
          </a>
        </nav>
        <Button
          className="bg-atlan-primary hover:bg-atlan-primary-dark text-white"
          onClick={() => (window.location.href = "/new")}
        >
          Create New JD
        </Button>
      </div>
    </header>
  )
}

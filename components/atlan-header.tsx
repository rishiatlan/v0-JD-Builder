"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Github, LogIn, LogOut } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { signOut } from "@/app/actions/auth-actions"

export function AtlanHeader() {
  const { authState } = useAuth()

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
          <Link href="/jd/new" className="text-slate-600 hover:text-atlan-primary font-medium">
            Create JD
          </Link>
          <Link href="/templates" className="text-slate-600 hover:text-atlan-primary font-medium">
            Templates
          </Link>
          <Link
            href="/standards"
            className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
          >
            Standards
          </Link>
          <a
            href="https://github.com/rishiatlan/v0-JD-Builder"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-atlan-primary font-medium flex items-center"
          >
            <Github className="h-4 w-4 mr-1" />
            Repository
          </a>
        </nav>
        <div className="flex items-center space-x-2">
          {authState.isAuthenticated ? (
            <>
              <span className="text-sm text-slate-600 hidden md:inline">
                {authState.user?.full_name || authState.user?.email}
              </span>
              <Button variant="outline" size="sm" onClick={() => signOut()} className="flex items-center">
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="flex items-center">
                <LogIn className="h-4 w-4 mr-1" />
                <span className="hidden md:inline">Sign In</span>
              </Button>
            </Link>
          )}
          <Button
            className="bg-atlan-primary hover:bg-atlan-primary-dark text-white"
            onClick={() => (window.location.href = "/jd/new")}
          >
            Create New JD
          </Button>
        </div>
      </div>
    </header>
  )
}

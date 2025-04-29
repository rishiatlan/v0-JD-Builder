"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { signOut } from "@/app/actions/auth-actions"
import {
  Github,
  LogIn,
  LogOut,
  Menu,
  X,
  Home,
  History,
  FileText,
  LayoutTemplateIcon as Template,
  Award,
  ChevronDown,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function EnhancedHeader() {
  const { authState } = useAuth()
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Track scroll position for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navItems = [
    { name: "Home", href: "/", icon: <Home className="h-4 w-4 mr-2" /> },
    { name: "History", href: "/history", icon: <History className="h-4 w-4 mr-2" /> },
    { name: "Create JD", href: "/jd/new", icon: <FileText className="h-4 w-4 mr-2" /> },
    { name: "Templates", href: "/templates", icon: <Template className="h-4 w-4 mr-2" /> },
    { name: "JD Standards", href: "/standards", icon: <Award className="h-4 w-4 mr-2" /> },
  ]

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-white",
      )}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo and Mobile Menu Button */}
          <div className="flex items-center">
            <button
              className="mr-2 rounded-md p-2 text-slate-500 hover:bg-slate-100 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="flex items-center">
              <div className="relative h-10 w-32">
                <Image src="/images/atlan-logo.png" alt="Atlan Logo" fill className="object-contain" priority />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-accent text-primary"
                    : "text-slate-600 hover:bg-slate-100 hover:text-primary",
                )}
              >
                {item.name}
              </Link>
            ))}
            <a
              href="https://github.com/rishiatlan/v0-JD-Builder"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-primary flex items-center"
            >
              <Github className="h-4 w-4 mr-2" />
              Repository
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {authState.isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-2">
                        <span className="text-sm font-medium">{authState.user?.email?.[0] || "U"}</span>
                      </div>
                      <span className="hidden md:inline text-sm font-medium">{authState.user?.email}</span>
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/history" className="cursor-pointer flex items-center">
                      <History className="h-4 w-4 mr-2" />
                      My JDs
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut()}
                    className="text-red-500 focus:text-red-500 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm" className="hidden md:flex items-center">
                  <LogIn className="h-4 w-4 mr-1" />
                  Sign In
                </Button>
              </Link>
            )}
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={() => (window.location.href = "/jd/new")}
            >
              Create JD
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-3 animate-fade-in">
            <div className="space-y-1 px-2 pb-3 pt-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-base font-medium",
                    pathname === item.href
                      ? "bg-accent text-primary"
                      : "text-slate-600 hover:bg-slate-100 hover:text-primary",
                  )}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
              <a
                href="https://github.com/rishiatlan/v0-JD-Builder"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-primary"
              >
                <Github className="h-4 w-4 mr-2" />
                Repository
              </a>
              {!authState.isAuthenticated && (
                <Link
                  href="/login"
                  className="flex items-center px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:bg-slate-100 hover:text-primary"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

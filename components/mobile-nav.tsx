"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import {
  Menu,
  Home,
  History,
  FileText,
  LayoutTemplateIcon as Template,
  Award,
  Github,
  LogIn,
  LogOut,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { signOut } from "@/app/actions/auth-actions"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { authState } = useAuth()

  const navItems = [
    { name: "Home", href: "/", icon: <Home className="h-5 w-5 mr-3" /> },
    { name: "History", href: "/history", icon: <History className="h-5 w-5 mr-3" /> },
    { name: "Create JD", href: "/jd/new", icon: <FileText className="h-5 w-5 mr-3" /> },
    { name: "Templates", href: "/templates", icon: <Template className="h-5 w-5 mr-3" /> },
    { name: "JD Standards", href: "/standards", icon: <Award className="h-5 w-5 mr-3" /> },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <div className="flex flex-col h-full">
          <div className="py-6">
            <h2 className="text-lg font-semibold mb-5 px-2">Atlan JD Builder</h2>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center py-3 px-2 rounded-md transition-colors",
                    pathname === item.href
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-slate-600 hover:bg-slate-100",
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
                className="flex items-center py-3 px-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Github className="h-5 w-5 mr-3" />
                Repository
              </a>
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-200 pt-4 pb-6 px-2">
            {authState.isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                    <span className="font-medium">{authState.user?.email?.[0] || "U"}</span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-medium truncate">{authState.user?.email}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                  onClick={() => {
                    signOut()
                    setOpen(false)
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link href="/login" onClick={() => setOpen(false)} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

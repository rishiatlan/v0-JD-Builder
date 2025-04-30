"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Home, FileText, LayoutTemplateIcon as Template, Award, Github } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Removed History page from navigation
  const navItems = [
    { name: "Home", href: "/", icon: <Home className="h-5 w-5 mr-3" /> },
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
        </div>
      </SheetContent>
    </Sheet>
  )
}

import { AtlanLogo } from "@/components/atlan-logo"
import Link from "next/link"

export function AtlanFooter() {
  return (
    <footer className="w-full bg-slate-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <AtlanLogo variant="white" className="h-8 w-auto mb-4" />
            <p className="text-slate-400 mt-4">Do your life's best work with Atlan</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">JD Builder</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-slate-400 hover:text-atlan-accent">
                  Create New JD
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-slate-400 hover:text-atlan-accent">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-slate-400 hover:text-atlan-accent">
                  History
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://github.com/rishiatlan/v0-JD-Builder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-atlan-accent"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://atlan.com/careers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-atlan-accent"
                >
                  Atlan Careers
                </a>
              </li>
              <li>
                <a
                  href="https://atlan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-atlan-accent"
                >
                  About Atlan
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
          <p>© {new Date().getFullYear()} Atlan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

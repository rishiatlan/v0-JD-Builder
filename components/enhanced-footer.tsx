import Link from "next/link"
import { AtlanLogo } from "@/components/atlan-logo"
import { Github, Twitter, Linkedin, Mail } from "lucide-react"

export function EnhancedFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="md:col-span-1">
            <AtlanLogo variant="white" className="h-8 w-auto mb-4" />
            <p className="text-slate-400 mt-4 max-w-xs">
              Do your life's best work with Atlan. The modern data workspace for collaboration.
            </p>
            <div className="flex space-x-4 mt-6">
              <a
                href="https://github.com/rishiatlan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com/atlanHQ"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://www.linkedin.com/company/atlanhq"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@atlan.com"
                className="text-slate-400 hover:text-white transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* JD Builder */}
          <div>
            <h3 className="font-semibold text-lg mb-4">JD Builder</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-slate-400 hover:text-atlan-primary transition-colors">
                  Create New JD
                </Link>
              </li>
              <li>
                <Link href="/templates" className="text-slate-400 hover:text-atlan-primary transition-colors">
                  Templates
                </Link>
              </li>
              <li>
                <Link href="/history" className="text-slate-400 hover:text-atlan-primary transition-colors">
                  History
                </Link>
              </li>
              <li>
                <Link href="/standards" className="text-slate-400 hover:text-atlan-primary transition-colors">
                  Standards of Excellence
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://github.com/rishiatlan/v0-JD-Builder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-atlan-primary transition-colors"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://atlan.com/careers"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-atlan-primary transition-colors"
                >
                  Atlan Careers
                </a>
              </li>
              <li>
                <a
                  href="https://atlan.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-atlan-primary transition-colors"
                >
                  About Atlan
                </a>
              </li>
              <li>
                <a
                  href="https://atlan.com/blog"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-atlan-primary transition-colors"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://atlan.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-atlan-primary transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://atlan.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-atlan-primary transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="https://atlan.com/cookies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-atlan-primary transition-colors"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">© {currentYear} Atlan. All rights reserved.</p>
          <p className="text-slate-500 text-xs mt-2 md:mt-0">Built with ❤️ by the Atlan team</p>
        </div>
      </div>
    </footer>
  )
}

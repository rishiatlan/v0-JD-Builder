"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { WifiOff, RefreshCw, Home } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
          <WifiOff className="h-8 w-8 text-slate-600" />
        </div>
        <h1 className="text-3xl font-bold text-atlan-primary mb-2">You're Offline</h1>
        <p className="text-slate-600">
          It looks like you've lost your internet connection. Some features may be limited until you're back online.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-3">What you can do:</h2>
        <ul className="space-y-3 mb-6">
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 mr-3 flex-shrink-0 text-xs font-medium">
              1
            </span>
            <span>Check your internet connection and try again</span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 mr-3 flex-shrink-0 text-xs font-medium">
              2
            </span>
            <span>Access any previously loaded job descriptions from your cache</span>
          </li>
          <li className="flex items-start">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 mr-3 flex-shrink-0 text-xs font-medium">
              3
            </span>
            <span>Continue working on drafts that were saved locally</span>
          </li>
        </ul>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => window.location.reload()} className="flex items-center justify-center">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>

          <Link href="/" passHref>
            <Button variant="outline" className="flex items-center justify-center">
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <p>
          <strong>Note:</strong> The Atlan JD Builder has offline capabilities. Your drafts and previously generated job
          descriptions should still be accessible.
        </p>
      </div>
    </div>
  )
}

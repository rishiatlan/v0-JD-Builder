import type React from "react"
import type { Metadata } from "next"
import { Inter, Lexend, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { AppContextProvider } from "@/lib/app-context"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const lexend = Lexend({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "Atlan JD Builder",
  description: "Create exceptional job descriptions with AI",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${lexend.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <AuthProvider>
          <AppContextProvider>
            {children}
            <Toaster />
          </AppContextProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

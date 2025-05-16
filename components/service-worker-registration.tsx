"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function ServiceWorkerRegistration() {
  const [isRegistered, setIsRegistered] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Only register service worker in production and not in preview environments
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.location.hostname !== "localhost" &&
      !window.location.hostname.includes("vusercontent.net") // Skip registration in preview environments
    ) {
      // Check if the service worker file exists before attempting registration
      fetch("/service-worker.js")
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Service worker file not found: ${response.status}`)
          }
          return navigator.serviceWorker.register("/service-worker.js")
        })
        .then((registration) => {
          console.log("Service Worker registered with scope:", registration.scope)
          setIsRegistered(true)

          // Listen for updates
          registration.onupdatefound = () => {
            const installingWorker = registration.installing
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    toast({
                      title: "App Updated",
                      description: "New content is available. Please refresh to update.",
                      duration: 5000,
                    })
                  }
                }
              }
            }
          }
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
          // Don't show error toast in preview environments
          if (!window.location.hostname.includes("vusercontent.net")) {
            toast({
              title: "Service Worker Error",
              description: "Offline functionality may be limited.",
              variant: "destructive",
              duration: 3000,
            })
          }
        })

      // Handle service worker updates
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        toast({
          title: "App Updated",
          description: "The app has been updated. Please refresh for the latest version.",
          duration: 5000,
        })
      })
    } else {
      console.log("Service Worker not registered: development environment or unsupported browser")
    }
  }, [toast])

  return null
}

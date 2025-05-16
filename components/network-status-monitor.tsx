"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Wifi, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function NetworkStatusMonitor() {
  const [isOnline, setIsOnline] = useState(true)
  const [showAlert, setShowAlert] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    // Define event handlers
    const handleOnline = () => {
      setIsOnline(true)
      setShowAlert(true)

      // Hide the alert after 5 seconds
      setTimeout(() => setShowAlert(false), 5000)

      toast({
        title: "You're back online",
        description: "Your connection has been restored.",
        duration: 3000,
      })

      // Trigger background sync if supported
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync
            .register("sync-jd-data")
            .catch((err) => console.error("Background sync registration failed:", err))
        })
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowAlert(true)

      toast({
        title: "You're offline",
        description: "Some features may be limited until you're back online.",
        variant: "destructive",
        duration: 5000,
      })
    }

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [toast])

  if (!showAlert) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {!isOnline ? (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You're offline</AlertTitle>
          <AlertDescription>Some features may be limited until you're back online.</AlertDescription>
        </Alert>
      ) : (
        <Alert variant="default" className="bg-green-50 border-green-200">
          <Wifi className="h-4 w-4" />
          <AlertTitle>You're back online</AlertTitle>
          <AlertDescription>Your connection has been restored.</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

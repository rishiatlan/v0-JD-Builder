"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useStorageService } from "@/hooks/use-storage-service"

export function NavigationStateManager() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { saveToStorage } = useStorageService()

  // Save navigation state when route changes
  useEffect(() => {
    const saveNavigationState = () => {
      const currentRoute = {
        pathname,
        search: searchParams.toString(),
        timestamp: Date.now(),
      }

      saveToStorage("navigation_state", currentRoute)
    }

    saveNavigationState()
  }, [pathname, searchParams, saveToStorage])

  return null
}

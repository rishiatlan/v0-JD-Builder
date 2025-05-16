"use client"

import { useState, useEffect, useCallback } from "react"
import { storageService } from "@/lib/indexed-db"
import { useToast } from "@/components/ui/use-toast"

type StorageType = "indexedDB" | "session" | "local"

export function useStorageService() {
  const [isInitialized, setIsInitialized] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const initStorage = async () => {
      try {
        await storageService.init()
        setIsInitialized(true)
      } catch (error) {
        console.error("Failed to initialize storage service:", error)
        toast({
          title: "Storage Error",
          description: "Failed to initialize storage. Some features may be limited.",
          variant: "destructive",
        })
      }
    }

    initStorage()
  }, [toast])

  const saveToStorage = useCallback(
    async (key: string, data: any, type: StorageType = "session", options: any = {}): Promise<boolean> => {
      if (!isInitialized && type === "indexedDB") {
        // Fall back to session storage if IndexedDB isn't initialized
        type = "session"
      }

      try {
        if (type === "indexedDB") {
          if (key.startsWith("document_")) {
            return await storageService.storeDocument(key.replace("document_", ""), data, {}, options)
          } else if (key.startsWith("jd_")) {
            return await storageService.storeJobDescription(key.replace("jd_", ""), data, options)
          } else {
            return await storageService.setCache(key, data, options)
          }
        } else if (type === "session") {
          sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
          return true
        } else if (type === "local") {
          localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
          return true
        }
        return false
      } catch (error) {
        console.error(`Error saving to ${type} storage:`, error)

        // Try fallback storage if primary fails
        if (type === "indexedDB") {
          try {
            sessionStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }))
            return true
          } catch (fallbackError) {
            console.error("Fallback storage also failed:", fallbackError)
            return false
          }
        }

        return false
      }
    },
    [isInitialized],
  )

  const getFromStorage = useCallback(
    async (key: string, type: StorageType = "session"): Promise<any> => {
      if (!isInitialized && type === "indexedDB") {
        // Fall back to session storage if IndexedDB isn't initialized
        type = "session"
      }

      try {
        if (type === "indexedDB") {
          if (key.startsWith("document_")) {
            const result = await storageService.getDocument(key.replace("document_", ""))
            return result ? result.content : null
          } else if (key.startsWith("jd_")) {
            return await storageService.getJobDescription(key.replace("jd_", ""))
          } else {
            return await storageService.getCache(key)
          }
        } else if (type === "session") {
          const item = sessionStorage.getItem(key)
          if (!item) return null
          return JSON.parse(item).data
        } else if (type === "local") {
          const item = localStorage.getItem(key)
          if (!item) return null
          return JSON.parse(item).data
        }
        return null
      } catch (error) {
        console.error(`Error retrieving from ${type} storage:`, error)

        // Try fallback storage if primary fails
        if (type === "indexedDB") {
          try {
            const item = sessionStorage.getItem(key)
            if (!item) return null
            return JSON.parse(item).data
          } catch (fallbackError) {
            console.error("Fallback retrieval also failed:", fallbackError)
            return null
          }
        }

        return null
      }
    },
    [isInitialized],
  )

  const removeFromStorage = useCallback(
    async (key: string, type: StorageType = "session"): Promise<boolean> => {
      if (!isInitialized && type === "indexedDB") {
        // Fall back to session storage if IndexedDB isn't initialized
        type = "session"
      }

      try {
        if (type === "indexedDB") {
          if (key.startsWith("document_")) {
            return await storageService.deleteItem("documents", key.replace("document_", ""))
          } else if (key.startsWith("jd_")) {
            return await storageService.deleteItem("jobDescriptions", key.replace("jd_", ""))
          } else {
            return await storageService.deleteItem("cache", key)
          }
        } else if (type === "session") {
          sessionStorage.removeItem(key)
          return true
        } else if (type === "local") {
          localStorage.removeItem(key)
          return true
        }
        return false
      } catch (error) {
        console.error(`Error removing from ${type} storage:`, error)
        return false
      }
    },
    [isInitialized],
  )

  const clearStorage = useCallback(
    async (type: StorageType = "session"): Promise<boolean> => {
      try {
        if (type === "indexedDB" && isInitialized) {
          await storageService.clearStore("documents")
          await storageService.clearStore("jobDescriptions")
          await storageService.clearStore("cache")
          return true
        } else if (type === "session") {
          sessionStorage.clear()
          return true
        } else if (type === "local") {
          localStorage.clear()
          return true
        }
        return false
      } catch (error) {
        console.error(`Error clearing ${type} storage:`, error)
        return false
      }
    },
    [isInitialized],
  )

  const getStorageMetrics = useCallback((): any => {
    if (isInitialized) {
      return storageService.getMetrics()
    }
    return null
  }, [isInitialized])

  return {
    isInitialized,
    saveToStorage,
    getFromStorage,
    removeFromStorage,
    clearStorage,
    getStorageMetrics,
  }
}

"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { analytics } from "@/lib/analytics"

// Define the types for our context
interface AppState {
  currentStep: number
  jdData: any | null
  isAnalyzing: boolean
  templateData: any | null
  recentJDs: any[]
  userPreferences: {
    theme: "light" | "dark" | "system"
    autoSave: boolean
  }
}

interface AppContextType {
  state: AppState
  setCurrentStep: (step: number) => void
  setJdData: (data: any | null) => void
  setIsAnalyzing: (isAnalyzing: boolean) => void
  setTemplateData: (data: any | null) => void
  addRecentJD: (jd: any) => void
  removeRecentJD: (id: string) => void
  clearRecentJDs: () => void
  updateUserPreference: <K extends keyof AppState["userPreferences"]>(
    key: K,
    value: AppState["userPreferences"][K],
  ) => void
}

// Create the context
const AppContext = createContext<AppContextType | undefined>(undefined)

// Initial state
const initialState: AppState = {
  currentStep: 1,
  jdData: null,
  isAnalyzing: false,
  templateData: null,
  recentJDs: [],
  userPreferences: {
    theme: "system",
    autoSave: true,
  },
}

// Create the provider component
export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    // Try to load state from localStorage on initial render
    if (typeof window !== "undefined") {
      try {
        const savedState = localStorage.getItem("atlan_jd_state")
        if (savedState) {
          const parsedState = JSON.parse(savedState)
          return {
            ...initialState,
            recentJDs: parsedState.recentJDs || [],
            userPreferences: parsedState.userPreferences || initialState.userPreferences,
          }
        }
      } catch (error) {
        console.error("Error loading state from localStorage:", error)
      }
    }
    return initialState
  })

  // Save certain parts of state to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stateToSave = {
          recentJDs: state.recentJDs,
          userPreferences: state.userPreferences,
        }
        localStorage.setItem("atlan_jd_state", JSON.stringify(stateToSave))
      } catch (error) {
        console.error("Error saving state to localStorage:", error)
      }
    }
  }, [state.recentJDs, state.userPreferences])

  // Initialize analytics
  useEffect(() => {
    analytics.init()
  }, [])

  // State updater functions
  const setCurrentStep = (step: number) => {
    setState((prev) => ({ ...prev, currentStep: step }))
    analytics.track("step_change", { step })
  }

  const setJdData = (data: any | null) => {
    setState((prev) => ({ ...prev, jdData: data }))
    if (data) {
      analytics.track("jd_data_updated", { title: data.title })
    }
  }

  const setIsAnalyzing = (isAnalyzing: boolean) => {
    setState((prev) => ({ ...prev, isAnalyzing }))
  }

  const setTemplateData = (data: any | null) => {
    setState((prev) => ({ ...prev, templateData: data }))
    if (data) {
      analytics.track("template_selected", { template: data.title })
    }
  }

  const addRecentJD = (jd: any) => {
    setState((prev) => {
      // Add unique ID if not present
      const jdWithId = jd.id ? jd : { ...jd, id: `jd_${Date.now()}` }

      // Add timestamp if not present
      const jdWithTimestamp = jdWithId.timestamp ? jdWithId : { ...jdWithId, timestamp: Date.now() }

      // Filter out any existing JD with the same ID
      const filteredJDs = prev.recentJDs.filter((item) => item.id !== jdWithTimestamp.id)

      // Add new JD to the beginning of the array
      return {
        ...prev,
        recentJDs: [jdWithTimestamp, ...filteredJDs].slice(0, 10), // Keep only the 10 most recent
      }
    })

    analytics.track("jd_saved", { title: jd.title })
  }

  const removeRecentJD = (id: string) => {
    setState((prev) => ({
      ...prev,
      recentJDs: prev.recentJDs.filter((jd) => jd.id !== id),
    }))

    analytics.track("jd_removed", { id })
  }

  const clearRecentJDs = () => {
    setState((prev) => ({
      ...prev,
      recentJDs: [],
    }))

    analytics.track("jds_cleared")
  }

  const updateUserPreference = <K extends keyof AppState["userPreferences"]>(
    key: K,
    value: AppState["userPreferences"][K],
  ) => {
    setState((prev) => ({
      ...prev,
      userPreferences: {
        ...prev.userPreferences,
        [key]: value,
      },
    }))

    analytics.track("preference_updated", { key, value })
  }

  // Create the context value
  const contextValue: AppContextType = {
    state,
    setCurrentStep,
    setJdData,
    setIsAnalyzing,
    setTemplateData,
    addRecentJD,
    removeRecentJD,
    clearRecentJDs,
    updateUserPreference,
  }

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
}

// Custom hook to use the context
export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}

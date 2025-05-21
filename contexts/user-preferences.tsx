"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define the types for our user preferences
export interface UserPreferences {
  preferredTranslation: string
  fontSize: "small" | "medium" | "large"
  darkMode: boolean
  saveHistory: boolean
}

// Define the default preferences
const defaultPreferences: UserPreferences = {
  preferredTranslation: "ESV",
  fontSize: "medium",
  darkMode: false,
  saveHistory: true,
}

// Define the context type
interface UserPreferencesContextType {
  preferences: UserPreferences
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void
  resetPreferences: () => void
}

// Create the context
const UserPreferencesContext = createContext<UserPreferencesContextType | undefined>(undefined)

// Create a provider component
export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [loaded, setLoaded] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const storedPreferences = localStorage.getItem("userPreferences")
      if (storedPreferences) {
        try {
          const parsedPreferences = JSON.parse(storedPreferences)
          setPreferences((prev) => ({ ...prev, ...parsedPreferences }))
        } catch (error) {
          console.error("Failed to parse stored preferences:", error)
        }
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error)
    }
    setLoaded(true)
  }, [])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    if (loaded) {
      try {
        localStorage.setItem("userPreferences", JSON.stringify(preferences))
      } catch (error) {
        console.error("Error saving to localStorage:", error)
      }
    }
  }, [preferences, loaded])

  // Function to update a single preference
  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  // Function to reset all preferences to defaults
  const resetPreferences = () => {
    setPreferences(defaultPreferences)
  }

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences }}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

// Custom hook to use the preferences context
export function useUserPreferences() {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider")
  }
  return context
}

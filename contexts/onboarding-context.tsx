"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface OnboardingContextType {
  showOnboarding: boolean
  setShowOnboarding: (show: boolean) => void
  hasCompletedOnboarding: boolean
  setHasCompletedOnboarding: (completed: boolean) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(true)

  // Check if user has seen onboarding on first render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const onboardingSeen = localStorage.getItem("onboardingSeen")
      const isFirstLogin = localStorage.getItem("firstLogin") === "true"
      
      if (isFirstLogin) {
        setHasCompletedOnboarding(false)
        setShowOnboarding(true)
      } else if (!onboardingSeen) {
        setHasCompletedOnboarding(false)
        setShowOnboarding(true)
      }
    }
  }, [])

  return (
    <OnboardingContext.Provider
      value={{
        showOnboarding,
        setShowOnboarding,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
} 
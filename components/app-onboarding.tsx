"use client"

import { useOnboarding } from "@/contexts/onboarding-context"
import OnboardingOverlay from "./onboarding-overlay"

export default function AppOnboarding() {
  const { showOnboarding, setShowOnboarding, hasCompletedOnboarding, setHasCompletedOnboarding } = useOnboarding()

  const handleOnboardingClose = () => {
    setShowOnboarding(false)
    localStorage.setItem("onboardingSeen", "true")
    localStorage.removeItem("firstLogin")
    setHasCompletedOnboarding(true)
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingOverlay onClose={handleOnboardingClose} />
      )}
    </>
  )
} 
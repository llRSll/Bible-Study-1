"use client"

import { useOnboarding } from "@/contexts/onboarding-context"
import OnboardingOverlay from "./onboarding-overlay"
import { usePathname } from "next/navigation"

export default function AppOnboarding() {
  const { showOnboarding, setShowOnboarding, hasCompletedOnboarding, setHasCompletedOnboarding } = useOnboarding()
  const pathname = usePathname()
  
  // Check if we're in the profile page
  const isHelpMode = pathname === "/profile" && hasCompletedOnboarding

  const handleOnboardingClose = () => {
    setShowOnboarding(false)
    
    // Only update localStorage if not in help mode
    if (!isHelpMode) {
      localStorage.setItem("onboardingSeen", "true")
      localStorage.removeItem("firstLogin")
      setHasCompletedOnboarding(true)
    }
  }

  return (
    <>
      {showOnboarding && (
        <OnboardingOverlay 
          onClose={handleOnboardingClose} 
          isHelpMode={isHelpMode}
        />
      )}
    </>
  )
} 
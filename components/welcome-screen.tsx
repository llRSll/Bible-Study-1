"use client"

import { useState, useEffect } from "react"
import { BookOpen } from "lucide-react"

export default function WelcomeScreen() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // Check if user has seen welcome screen
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome")
    if (hasSeenWelcome) {
      setVisible(false)
    }
  }, [])

  const handleGetStarted = () => {
    localStorage.setItem("hasSeenWelcome", "true")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="welcome-screen">
      <div className="welcome-logo">
        <BookOpen className="welcome-logo-icon" />
      </div>
      <h1 className="welcome-title">Faithful Study</h1>
      <p className="welcome-subtitle">
        Explore the Bible with AI-powered studies that remain true to Biblical teachings and help deepen your
        understanding of God's Word.
      </p>
      <button className="welcome-button" onClick={handleGetStarted}>
        Get Started
      </button>
    </div>
  )
}

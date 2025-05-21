"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, MessageSquare, Search, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export default function OnboardingOverlay() {
  const [isVisible, setIsVisible] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has seen onboarding
    const onboardingSeen = localStorage.getItem("onboardingSeen")
    if (!onboardingSeen) {
      // Delay showing onboarding to allow page to load
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setHasSeenOnboarding(true)
    }
  }, [])

  const completeOnboarding = () => {
    localStorage.setItem("onboardingSeen", "true")
    setIsVisible(false)
    setHasSeenOnboarding(true)
  }

  const steps = [
    {
      title: "Welcome to Faithful Study",
      description: "Your AI-powered Bible study companion that stays true to scripture",
      icon: BookOpen,
      content: "Discover deeper insights into God's Word with studies generated specifically for you.",
    },
    {
      title: "Ask Biblical Questions",
      description: "Get answers backed by scripture",
      icon: MessageSquare,
      content: "Ask any question about the Bible or faith, and receive answers with relevant verses and guidance.",
    },
    {
      title: "Search Scripture",
      description: "Find verses and studies on any topic",
      icon: Search,
      content: "Easily search the Bible to find relevant verses and studies for your spiritual journey.",
    },
  ]

  const currentStepData = steps[currentStep]

  if (!isVisible || hasSeenOnboarding) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md"
        >
          <Card className="border-2 border-primary/20">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {currentStepData.icon && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <currentStepData.icon className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="font-serif">{currentStepData.title}</CardTitle>
                    <CardDescription>{currentStepData.description}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={completeOnboarding} className="h-8 w-8">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{currentStepData.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-6 rounded-full ${index === currentStep ? "bg-primary" : "bg-primary/20"}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" onClick={() => setCurrentStep((prev) => prev - 1)}>
                    Previous
                  </Button>
                )}
                {currentStep < steps.length - 1 ? (
                  <Button onClick={() => setCurrentStep((prev) => prev + 1)}>Next</Button>
                ) : (
                  <Button onClick={completeOnboarding}>Get Started</Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

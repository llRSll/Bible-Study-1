"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, MessageSquare, Search, X, Sparkles, BookMarked, Heart, Share2, User, Bookmark } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface OnboardingOverlayProps {
  onClose?: () => void;
}

export default function OnboardingOverlay({ onClose }: OnboardingOverlayProps) {
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
    if (onClose) {
      onClose();
    }
  }

  const steps = [
    {
      title: "Welcome to Faithful Study",
      description: "Your AI-powered Bible study companion that stays true to scripture",
      icon: BookOpen,
      content: "Discover deeper insights into God's Word with studies generated specifically for you.",    
     },

      {
        title: "Search Scripture",
        description: "Find verses and studies on any topic",
        icon: Search,
        content: "Easily search the Bible to find relevant verses and studies for your spiritual journey.",
      },
    {
      title: "Generate Bible Studies",
      description: "AI-powered studies tailored to your needs",
      icon: Sparkles,
      content: "Generate Bible studies on any topic, verse, or question. Our AI creates structured studies with relevant verses, commentary, and application points all grounded in scripture.",
    },
    {
      title: "Ask Biblical Questions",
      description: "Get answers backed by scripture",
      icon: MessageSquare,
      content: "Ask any question about the Bible, theology, or Christian living. Receive thoughtful answers supported by relevant verses and theological insights from trusted sources.",
    },
    {
      title: "Personalized Experience",
      description: "Customize your study preferences",
      icon: User,
      content: "Set your preferred Bible translation, study topics, and notification preferences. The more you use Faithful Study, the more personalized your experience becomes.",
    }
  ]

  const currentStepData = steps[currentStep]

  // If manually triggered (via help button), we should show regardless of hasSeenOnboarding
  if ((!isVisible && hasSeenOnboarding) && !onClose) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="w-full max-w-md my-4 sm:my-0"
        >
          <Card className="border-2 border-primary/20">
            <CardHeader className="px-4 sm:px-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                <div className="flex items-start sm:items-center gap-2">
                  {currentStepData.icon && (
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <currentStepData.icon className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div>
                    <CardTitle className="font-serif text-lg sm:text-xl">{currentStepData.title}</CardTitle>
                    <CardDescription className="text-sm">{currentStepData.description}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={completeOnboarding} className="h-8 w-8 absolute top-2 right-2 sm:static">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <p className="text-muted-foreground text-sm sm:text-base">{currentStepData.content}</p>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex gap-1 justify-center sm:justify-start w-full sm:w-auto">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 w-6 rounded-full ${index === currentStep ? "bg-primary" : "bg-primary/20"}`}
                  />
                ))}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                {currentStep > 0 && (
                  <Button variant="outline" onClick={() => setCurrentStep((prev) => prev - 1)} className="flex-1 sm:flex-auto">
                    Previous
                  </Button>
                )}
                {currentStep < steps.length - 1 ? (
                  <Button onClick={() => setCurrentStep((prev) => prev + 1)} className="flex-1 sm:flex-auto">Next</Button>
                ) : (
                  <Button onClick={completeOnboarding} className="flex-1 sm:flex-auto">Get Started</Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

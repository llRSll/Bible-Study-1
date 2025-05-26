"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { VerseDisplay } from "@/components/verse-display"
import { createStudy } from "@/lib/actions/study"
import { BibleStudy, Insight } from "@/lib/claude-ai"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, CheckCircle, ChevronLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function StudyPreviewPage() {
  const [study, setStudy] = useState<BibleStudy | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Get the study from sessionStorage
    const storedStudy = sessionStorage.getItem('previewStudy')
    if (storedStudy) {
      setStudy(JSON.parse(storedStudy))
    } else {
      // If no study is found, redirect back to the new study page
      router.push('/studies/new')
    }
  }, [router])

  const handleSaveStudy = async () => {
    if (!study || saving || saved) return

    setSaving(true)
    try {
      // Create a FormData object to send to the server
      const formData = new FormData()
      formData.append("title", study.title)
      formData.append("verses", JSON.stringify(study.verses))
      formData.append("context", study.context || "")
      formData.append("insights", JSON.stringify(study.insights))
      formData.append("application", study.application || "")
      formData.append("category", study.category || "Spiritual Growth")
      formData.append("readTime", study.readTime || `${Math.ceil(study.verses.length * 2)} min`)
      formData.append("relatedQuestions", JSON.stringify(study.relatedQuestions || []))
      
      // Calculate related topics from the study
      const topics = [
        study.category || "Spiritual Growth",
        ...study.title.split(" ").filter(word => word.length > 4),
        // Extract topics from verses references (e.g., "John", "Romans")
        ...study.verses.map(verse => verse.split(" ")[0]).filter(book => book.length > 3)
      ]
      // Remove duplicates and limit to 5 topics
      const uniqueTopics = [...new Set(topics)].slice(0, 5)
      formData.append("relatedTopics", JSON.stringify(uniqueTopics))
      
      // Call the server action to save the study
      const result = await createStudy(formData)
      
      if (result.error) {
        throw new Error(result.error.message || "Failed to save study")
      }
      
      setSaved(true)
      toast({
        title: "Study saved successfully",
        description: "Your Bible study has been saved to your library",
      })
      
      // Clear the preview study from sessionStorage
      sessionStorage.removeItem('previewStudy')
      
      // Redirect to the saved study page
      router.push(`/studies`)
    } catch (error) {
      console.error("Failed to save study:", error)
      toast({
        title: "Failed to save study",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
      setSaving(false)
    }
  }

  if (!study) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="study-header">
        <Link href="/studies/new" className="back-button">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="header-title">{study.title}</h1>
      </div>

      <div className="study-content">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="animate-fade-in"
          >
            <h2 className="section-title">Scripture</h2>
            <div className="scripture-cards">
              {study.verses.map((verse: string, index: number) => (
                <VerseDisplay key={index} reference={verse} translation="ESV" />
              ))}
            </div>

            <h2 className="section-title">Study Insights</h2>
            <div className="insight-cards">
              <div className="insight-card">
                <h3 className="insight-title">Context</h3>
                <p className="insight-content">{study.context}</p>
              </div>

              {study.insights.map((insight: Insight, index: number) => (
                <div key={index} className="insight-card">
                  <h3 className="insight-title">{insight.title}</h3>
                  <p className="insight-content">{insight.description}</p>
                </div>
              ))}
            </div>

            <h2 className="section-title">Application</h2>
            <div className="insight-cards">
              <div className="insight-card">
                <p className="insight-content">{study.application}</p>
              </div>
            </div>

            <h2 className="section-title">Reflection Questions</h2>
            <div className="question-cards">
              {study.relatedQuestions?.map((question, index) => (
                <div key={index} className="question-card">
                  <div className="question-number">{index + 1}</div>
                  <p className="question-text">{question}</p>
                </div>
              )) || (
                [
                  "How does this study apply to your life right now?",
                  "What verse stood out to you the most and why?",
                  "What is one action you can take based on what you've learned?",
                  "How might this change your understanding of God's character?",
                ].map((question, index) => (
                  <div key={index} className="question-card">
                    <div className="question-number">{index + 1}</div>
                    <p className="question-text">{question}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-center mt-8 mb-4">
              <Button 
                className="mr-2 min-w-32"
                onClick={handleSaveStudy}
                disabled={saving || saved || study?.cannotGenerate}
              >
                {saved ? (
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Saved
                  </span>
                ) : saving ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-4 w-4 mr-2" />
                    Save Study
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
} 
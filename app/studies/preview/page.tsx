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
      <div className="study-header px-4 sm:px-6 py-4 sm:py-6 border-b">
        <Link href="/studies/new" className="back-button">
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </Link>
        <h1 className="header-title text-lg sm:text-2xl font-bold">{study.title}</h1>
      </div>

      <div className="study-content px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="animate-fade-in space-y-8"
          >
            <section>
              <h2 className="section-title text-lg sm:text-xl font-bold mb-4">Scripture</h2>
              <div className="space-y-4">
                {study.verses.map((verse: string, index: number) => (
                  <VerseDisplay key={index} reference={verse} translation="ESV" />
                ))}
              </div>
            </section>

            <section>
              <h2 className="section-title text-lg sm:text-xl font-bold mb-4">Study Insights</h2>
              <div className="space-y-4">
                <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                  <h3 className="insight-title text-base sm:text-lg font-semibold mb-2">Context</h3>
                  <p className="insight-content text-sm sm:text-base text-slate-700 leading-relaxed">{study.context}</p>
                </div>

                {study.insights.map((insight: Insight, index: number) => (
                  <div key={index} className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                    <h3 className="insight-title text-base sm:text-lg font-semibold mb-2">{insight.title}</h3>
                    <p className="insight-content text-sm sm:text-base text-slate-700 leading-relaxed">{insight.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="section-title text-lg sm:text-xl font-bold mb-4">Application</h2>
              <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{study.application}</p>
              </div>
            </section>

            <section>
              <h2 className="section-title text-lg sm:text-xl font-bold mb-4">Reflection Questions</h2>
              <div className="space-y-4">
                {study.relatedQuestions?.map((question, index) => (
                  <div key={index} className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-white font-semibold text-sm sm:text-base">{index + 1}</span>
                      </div>
                      <p className="text-slate-700 text-sm sm:text-base leading-relaxed">{question}</p>
                    </div>
                  </div>
                )) || (
                  [
                    "How does this study apply to your life right now?",
                    "What verse stood out to you the most and why?",
                    "What is one action you can take based on what you've learned?",
                    "How might this change your understanding of God's character?",
                  ].map((question, index) => (
                    <div key={index} className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center">
                          <span className="text-white font-semibold text-sm sm:text-base">{index + 1}</span>
                        </div>
                        <p className="text-slate-700 text-sm sm:text-base leading-relaxed">{question}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <div className="flex justify-center mt-8 mb-4">
              <Button 
                className="min-w-32 text-sm sm:text-base h-10 sm:h-11 px-6"
                onClick={handleSaveStudy}
                disabled={saving || saved || study?.cannotGenerate}
              >
                {saved ? (
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Saved
                  </span>
                ) : saving ? (
                  <span className="flex items-center">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
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
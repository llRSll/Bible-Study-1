"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { VerseDisplay } from "@/components/verse-display"
import { createStudy } from "@/lib/actions/study"
import { BibleStudy, generateBibleStudy, Insight } from "@/lib/claude-ai"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowRight, CheckCircle, ChevronLeft, Lightbulb, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type React from "react"
import { useState } from "react"

export default function NewStudyPage() {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [study, setStudy] = useState<BibleStudy | null>(null)
  const [activeTab, setActiveTab] = useState("topic")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || loading) return

    setLoading(true)
    setSaved(false) // Reset saved state when generating a new study

    try {
      console.log("Generating study on:", topic)

      // Call the Claude-powered function to generate a study
      const generatedStudy = await generateBibleStudy(topic, activeTab)
      console.log("Study generated successfully")

      setStudy(generatedStudy)

      if (generatedStudy.cannotGenerate) {
        toast({
          title: "Limited Study Generated",
          description: "Only a placeholder study could be created due to limitations",
        })
      } else {
        toast({
          title: "Study generated successfully",
          description: "Redirecting to study preview...",
        })
      }
      
      // Store the generated study in sessionStorage to pass to the preview page
      // Always store and redirect, even for limited studies
      sessionStorage.setItem('previewStudy', JSON.stringify(generatedStudy))
      
      // Navigate to the study preview page
      router.push(`/studies/preview`)
    } catch (error) {
      console.error("Failed to generate study:", error)
      toast({
        title: "Failed to generate study",
        description: "Please try again later",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  const handleSaveStudy = async () => {
    // Don't allow saving if the study is null, already saving/saved, or if there was an error generating it
    if (!study || saving || saved || study.cannotGenerate) return
    
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
      formData.append('relatedTopics', JSON.stringify(study.relatedTopics || []))
      
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
      
      toast({
        title: "Study saved successfully",
        description: "Your study has been saved to your collection",
      })
      
      setSaved(true)
      
      // Redirect to the study detail page after a short delay
      setTimeout(() => {
        router.push(`/studies`)
      }, 1500)
      
    } catch (error) {
      console.error("Failed to save study:", error)
      toast({
        title: "Failed to save study",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const presetTopics = [
    "The Armor of God",
    "Forgiveness in Scripture",
    "Prayer in the Bible",
    "Faith and Works",
    "The Holy Spirit",
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <div className="study-header px-4 sm:px-6 py-4 sm:py-6 border-b">
        <Link href="/studies" className="back-button">
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </Link>
        <h1 className="header-title text-lg sm:text-2xl font-bold">Create Study</h1>
      </div>

      <div className="study-content px-4 sm:px-6 py-6 sm:py-8">
        <Card className="mb-8 border-primary/20">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              Generate a Bible Study
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">Our AI will create a Bible study that stays true to scripture</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="topic" onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="topic" className="text-sm sm:text-base">By Topic</TabsTrigger>
                  <TabsTrigger value="verse" className="text-sm sm:text-base">By Verse</TabsTrigger>
                  <TabsTrigger value="question" className="text-sm sm:text-base">By Question</TabsTrigger>
                </TabsList>

                <TabsContent value="topic">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="topic" className="text-xs sm:text-sm font-medium">Study Topic</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., The Beatitudes, Faith, Prayer"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                        className="mt-1.5 text-sm sm:text-base h-10 sm:h-11"
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm sm:text-base">Suggested Topics</Label>
                      <div className="flex flex-wrap gap-2">
                        {presetTopics.map((presetTopic) => (
                          <Button
                            key={presetTopic}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTopic(presetTopic)}
                            className="text-xs sm:text-sm h-8 sm:h-9 whitespace-normal text-left"
                          >
                            {presetTopic}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="verse">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="verse" className="text-sm sm:text-base">Bible Verse or Passage</Label>
                      <Input
                        id="verse"
                        placeholder="e.g., John 3:16, Romans 8:1-11"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                        className="mt-1.5 text-sm sm:text-base h-10 sm:h-11"
                      />
                    </div>

                    <div className="p-3 sm:p-4 bg-muted/50 rounded-md border border-border flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Enter a specific verse or passage to create a focused study on its meaning and application.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="question">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="question" className="text-sm sm:text-base">Your Question</Label>
                      <Textarea
                        id="question"
                        placeholder="e.g., How can I grow in faith during difficult times?"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                        rows={3}
                        className="mt-1.5 resize-none text-sm sm:text-base"
                      />
                    </div>

                    <div className="p-3 sm:p-4 bg-muted/50 rounded-md border border-border flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm sm:text-base text-muted-foreground">
                        Ask a specific question about faith, doctrine, or Biblical principles to receive a study that
                        addresses your inquiry.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <div className="mt-6">
                  <Button
                    type="submit"
                    className="w-full text-sm sm:text-base h-10 sm:h-11"
                    disabled={loading || !topic.trim()}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                        Generating Study...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Generate Study
                      </span>
                    )}
                  </Button>
                </div>
              </Tabs>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

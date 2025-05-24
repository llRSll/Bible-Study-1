"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, ArrowRight, Lightbulb, ChevronLeft } from "lucide-react"
import { generateBibleStudy, Insight, BibleStudy } from "@/lib/claude-ai"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { VerseDisplay } from "@/components/verse-display"

export default function NewStudyPage() {
  const [topic, setTopic] = useState("")
  const [loading, setLoading] = useState(false)
  const [study, setStudy] = useState<BibleStudy | null>(null)
  const [activeTab, setActiveTab] = useState("topic")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topic.trim() || loading) return

    setLoading(true)

    try {
      console.log("Generating study on:", topic)

      // Call the Claude-powered function to generate a study
      const generatedStudy = await generateBibleStudy(topic, activeTab)
      console.log("Study generated successfully")

      console.log("Generated study:", generatedStudy);

      setStudy(generatedStudy)

      toast({
        title: generatedStudy.cannotGenerate ? "Limited Study Generated" : "Study generated successfully",
        description: generatedStudy.cannotGenerate
          ? "Only a placeholder study could be created due to limitations"
          : "Your Bible study is ready to explore",
      })
    } catch (error) {
      console.error("Failed to generate study:", error)
      toast({
        title: "Failed to generate study",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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
      <div className="study-header">
        <Link href="/studies" className="back-button">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="header-title">Create Study</h1>
      </div>

      <div className="study-content">
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif">
              <Sparkles className="h-5 w-5 text-primary" />
              Generate a Bible Study
            </CardTitle>
            <CardDescription>Our AI will create a Bible study that stays true to scripture</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="topic" onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="topic">By Topic</TabsTrigger>
                  <TabsTrigger value="verse">By Verse</TabsTrigger>
                  <TabsTrigger value="question">By Question</TabsTrigger>
                </TabsList>

                <TabsContent value="topic">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="topic">Study Topic</Label>
                      <Input
                        id="topic"
                        placeholder="e.g., The Beatitudes, Faith, Prayer"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block">Suggested Topics</Label>
                      <div className="flex flex-wrap gap-2">
                        {presetTopics.map((presetTopic) => (
                          <Button
                            key={presetTopic}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setTopic(presetTopic)}
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
                      <Label htmlFor="verse">Bible Verse or Passage</Label>
                      <Input
                        id="verse"
                        placeholder="e.g., John 3:16, Romans 8:1-11"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                        className="mt-1.5"
                      />
                    </div>

                    <div className="p-3 bg-muted/50 rounded-md border border-border flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Enter a specific verse or passage to create a focused study on its meaning and application.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="question">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="question">Your Question</Label>
                      <Textarea
                        id="question"
                        placeholder="e.g., How can I grow in faith during difficult times?"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                        rows={3}
                        className="mt-1.5 resize-none"
                      />
                    </div>

                    <div className="p-3 bg-muted/50 rounded-md border border-border flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground">
                        Ask a specific question about faith, doctrine, or Biblical principles to receive a study that
                        addresses your inquiry.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full mt-6 group" disabled={!topic.trim() || loading}>
                {loading ? "Generating..." : "Generate Bible Study"}
                {!loading && <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />}
              </Button>
            </form>
          </CardContent>
        </Card>

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card>
                <CardHeader>
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {study && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="animate-fade-in"
            >
              <div className="mb-4">
                <h2 className="text-xl font-semibold font-serif text-center">{study.title}</h2>
              </div>

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
                {[
                  "How does this study apply to your life right now?",
                  "What verse stood out to you the most and why?",
                  "What is one action you can take based on what you've learned?",
                  "How might this change your understanding of God's character?",
                ].map((question, index) => (
                  <div key={index} className="question-card">
                    <div className="question-number">{index + 1}</div>
                    <p className="question-text">{question}</p>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-8 mb-4">
                <Button className="mr-2">Save Study</Button>
                <Button variant="outline">Share</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

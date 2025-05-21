"use client"

import { useState, useEffect, use } from "react"
import { ChevronLeft, Bookmark, Heart, Share2, MessageSquare, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { VerseDisplay } from "@/components/verse-display"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = use(params);
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [translation, setTranslation] = useState("ESV")
  const { toast } = useToast()

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // In a real app, you would fetch the study data based on the ID
  const studyData = {
    title: id === "forgiveness" ? "Forgiveness" : "The Beatitudes",
    scriptures:
      id === "forgiveness"
        ? [
            {
              reference: "Matthew 6:14-15",
              translation: "ESV",
            },
            {
              reference: "Colossians 3:13",
              translation: "ESV",
            },
            {
              reference: "Matthew 18:21-22",
              translation: "ESV",
            },
            {
              reference: "Ephesians 4:32",
              translation: "ESV",
            },
          ]
        : [
            {
              reference: "Matthew 5:3-4",
              translation: "ESV",
            },
            {
              reference: "Matthew 5:5-6",
              translation: "ESV",
            },
            {
              reference: "Matthew 5:7-8",
              translation: "ESV",
            },
          ],
    insights:
      id === "forgiveness"
        ? [
            {
              title: "The Importance of Forgiveness",
              content:
                "Forgiveness is a central theme in Christianity. Jesus teaches that our willingness to forgive others is directly connected to receiving God's forgiveness. It's not optional for believers but a fundamental aspect of following Christ.",
            },
            {
              title: "Unlimited Forgiveness",
              content:
                'When Peter asked Jesus how many times he should forgive someone, Jesus answered "seventy-seven times," indicating that forgiveness should be unlimited. Christians are called to forgive repeatedly, just as God repeatedly forgives us.',
            },
            {
              title: "Forgiveness as Reflection of God's Character",
              content:
                "When we forgive others, we reflect God's character. Paul reminds us in Ephesians that we should forgive as God in Christ has forgiven us. Our forgiveness of others is a response to and reflection of the forgiveness we've received.",
            },
          ]
        : [
            {
              title: "Understanding the Beatitudes",
              content:
                "The Beatitudes are declarations of blessedness, describing the ideal disciple and the rewards that will be theirs. They form the opening section of the Sermon on the Mount.",
            },
            {
              title: "Poor in Spirit",
              content:
                'To be "poor in spirit" is to recognize your spiritual poverty and need for God. It refers to humility before God, acknowledging that we are nothing without Him.',
            },
            {
              title: "The Kingdom Promise",
              content:
                "The kingdom of heaven is both a present reality and a future hope. Those who humble themselves before God experience His reign in their lives now, while also awaiting the full realization of His kingdom in the age to come.",
            },
          ],
    reflectionQuestions:
      id === "forgiveness"
        ? [
            "Is there someone in your life you need to forgive? What is holding you back?",
            "How has experiencing God's forgiveness changed your ability to forgive others?",
            "What practical steps can you take to forgive someone who has deeply hurt you?",
            "How might your relationships change if you practiced forgiveness more freely?",
          ]
        : [
            "In what ways do you recognize your spiritual poverty and need for God?",
            'How does being "poor in spirit" differ from low self-esteem?',
            "How might embracing meekness change your relationships with others?",
            'What does it mean to "hunger and thirst for righteousness" in your daily life?',
          ],
  }

  const handleTranslationChange = (value: string) => {
    setTranslation(value)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The verse has been copied to your clipboard.",
      duration: 2000,
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="study-header">
          <Link href="/studies" className="back-button">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="header-title">Loading...</h1>
        </div>
        <div className="study-content">
          <div className="h-8 w-3/4 loading-skeleton mb-4"></div>

          <div className="h-5 w-1/3 loading-skeleton mb-4"></div>
          <div className="h-32 loading-skeleton mb-4"></div>
          <div className="h-32 loading-skeleton mb-4"></div>

          <div className="h-5 w-1/3 loading-skeleton mb-4"></div>
          <div className="h-24 loading-skeleton mb-4"></div>
          <div className="h-24 loading-skeleton mb-4"></div>

          <div className="h-5 w-1/3 loading-skeleton mb-4"></div>
          <div className="h-16 loading-skeleton mb-4"></div>
          <div className="h-16 loading-skeleton mb-4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="study-header">
        <Link href="/studies" className="back-button">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="header-title">{studyData.title}</h1>
      </div>

      <div className="study-content">
        <h1 className="study-title">{studyData.title}</h1>

        <div className="flex justify-end mb-4">
          <Select value={translation} onValueChange={handleTranslationChange}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Translation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ESV">ESV</SelectItem>
              <SelectItem value="KJV">KJV</SelectItem>
              <SelectItem value="NIV">NIV</SelectItem>
              <SelectItem value="NASB">NASB</SelectItem>
              <SelectItem value="NLT">NLT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <h2 className="section-title">Scripture</h2>

        <div className="scripture-cards">
          {studyData.scriptures.map((scripture, index) => (
            <VerseDisplay key={index} reference={scripture.reference} translation={translation} />
          ))}
        </div>

        <h2 className="section-title">Study Insights</h2>

        <div className="insight-cards">
          {studyData.insights.map((insight, index) => (
            <div key={index} className="insight-card">
              <h3 className="insight-title">{insight.title}</h3>
              <p className="insight-content">{insight.content}</p>
            </div>
          ))}
        </div>

        <h2 className="section-title">Reflection Questions</h2>

        <div className="question-cards">
          {studyData.reflectionQuestions.map((question, index) => (
            <div key={index} className="question-card">
              <div className="question-number">{index + 1}</div>
              <p className="question-text">{question}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="study-actions">
        <div className="action-buttons">
          <button
            className={`action-button ${bookmarked ? "active" : ""}`}
            onClick={() => setBookmarked(!bookmarked)}
            aria-label="Bookmark"
          >
            <Bookmark className="action-icon" fill={bookmarked ? "currentColor" : "none"} />
          </button>
          <button
            className={`action-button ${liked ? "active" : ""}`}
            onClick={() => setLiked(!liked)}
            aria-label="Like"
          >
            <Heart className="action-icon" fill={liked ? "currentColor" : "none"} />
          </button>
          <button className="action-button" aria-label="Share">
            <Share2 className="action-icon" />
          </button>
          <button className="action-button" aria-label="Comment">
            <MessageSquare className="action-icon" />
          </button>
        </div>
        <div className="pagination-buttons">
          <button className="pagination-button" aria-label="Previous page">
            <ChevronLeft className="pagination-icon" />
          </button>
          <button className="pagination-button" aria-label="Next page">
            <ChevronRight className="pagination-icon" />
          </button>
        </div>
      </div>
    </div>
  )
}

"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Info, MessageSquare, AlertTriangle } from "lucide-react"
import { askBibleQuestion, type ScriptureReference } from "@/lib/claude-ai"
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation"

interface ChatMessage {
  type: "question" | "answer"
  content: string
  timestamp: Date
  scriptures?: ScriptureReference[]
  application?: string
  isApiError?: boolean
  cannotAnswer?: boolean
  reason?: string
}

export default function AskPage() {
  const searchParams = useSearchParams()
  const [question, setQuestion] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const exampleQuestions = [
    "What does the Bible say about forgiveness?",
    "How can I overcome anxiety as a Christian?",
    "What is the meaning of John 3:16?",
    "What does the Bible teach about prayer?",
  ]

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory, isTyping])

  // Handle query parameter from URL
  useEffect(() => {
    const queryParam = searchParams.get("q")
    if (queryParam && chatHistory.length === 0) {
      setQuestion(queryParam)
      // Scroll to input field
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      // Submit the question after a short delay to allow state to update
      setTimeout(() => {
        handleSubmit({ preventDefault: () => {} } as React.FormEvent)
      }, 100)
    }
  }, [searchParams])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isLoading) return

    const userQuestion = question.trim()

    // Add user question to chat
    setChatHistory((prev) => [
      ...prev,
      {
        type: "question",
        content: userQuestion,
        timestamp: new Date(),
      },
    ])

    setIsLoading(true)
    setQuestion("")

    // Show typing indicator after a short delay
    setTimeout(() => {
      setIsTyping(true)
      scrollToBottom()
    }, 500)

    try {
      console.log("Sending question to API:", userQuestion)

      // Call Claude API with error handling
      const answer = await askBibleQuestion(userQuestion)
      console.log("Received answer from API")

      // Add a random delay to simulate thinking/typing (1-2 seconds)
      const randomDelay = Math.floor(Math.random() * 1000) + 1000
      await new Promise((resolve) => setTimeout(resolve, randomDelay))

      // Add Claude's response to chat history
      setChatHistory((prev) => [
        ...prev,
        {
          type: "answer",
          content: answer.content,
          scriptures: answer.scriptures,
          application: answer.application,
          timestamp: new Date(),
          isApiError: answer.isApiError,
          cannotAnswer: answer.cannotAnswer,
          reason: answer.reason,
        },
      ])
    } catch (error) {
      console.error("Error getting answer:", error)

      // Add error message to chat
      setChatHistory((prev) => [
        ...prev,
        {
          type: "answer",
          content: `I'm sorry, I encountered an error while processing your question about "${userQuestion}".`,
          scriptures: [
            {
              reference: "Proverbs 3:5-6",
              translation: "NIV",
              text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.",
            },
          ],
          timestamp: new Date(),
          isApiError: true,
          cannotAnswer: true,
          reason: "There was an unexpected error processing your question. Please try again later.",
        },
      ])
    } finally {
      setIsTyping(false)
      setIsLoading(false)
      scrollToBottom()
    }
  }

  const handleExampleClick = (q: string) => {
    setQuestion(q)
    // Auto-submit after a short delay
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} } as React.FormEvent)
    }, 100)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="pt-12 pb-6 px-6">
        <h1 className="text-4xl font-extrabold tracking-tight mb-1">Ask</h1>
        <p className="text-slate-500 text-lg">Get biblical answers</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-32 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {chatHistory.length === 0 ? (
            <div className="text-center py-6 animate-fade-in">
              <div className="h-20 w-20 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <MessageSquare className="h-10 w-10 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Bible Wisdom</h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Ask any question about the Bible, theology, or Christian living. Our AI will provide biblically-based
                answers with scripture references.
              </p>

              <h3 className="font-medium mb-4 text-lg">Try asking:</h3>
              <div className="space-y-3 max-w-md mx-auto">
                {exampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    className="w-full text-left p-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm border border-slate-200 transition-colors"
                    onClick={() => handleExampleClick(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {chatHistory.map((item, index) => (
                <div key={index} className="message-group">
                  {item.type === "question" && (
                    <div className="flex flex-col items-end">
                      <div className="bg-slate-900 text-white p-4 rounded-xl rounded-tr-sm max-w-[85%]">
                        {item.content}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{formatTime(item.timestamp)}</div>
                    </div>
                  )}

                  {item.type === "answer" && (
                    <div className="flex flex-col items-start">
                      <div className="bg-white border border-slate-200 p-4 rounded-xl rounded-tl-sm max-w-[85%] shadow-sm">
                        {item.cannotAnswer && item.reason && (
                          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4 flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-amber-800 text-sm font-medium">Cannot Answer</p>
                              <p className="text-amber-700 text-sm">{item.reason}</p>
                            </div>
                          </div>
                        )}

                        <p className="mb-4">{item.content}</p>

                        {item.scriptures && item.scriptures.length > 0 && (
                          <div className="space-y-4 mb-4">
                            <h4 className="font-semibold text-slate-900">Scripture References</h4>
                            {item.scriptures.map((scripture, i) => (
                              <div key={i} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium">{scripture.reference}</span>
                                  <span className="text-xs text-slate-500">{scripture.translation}</span>
                                </div>
                                <p className="text-slate-700 italic">{scripture.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.application && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-slate-900 mb-2">Application</h4>
                            <p className="text-slate-700">{item.application}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                          <Info className="h-3.5 w-3.5" />
                          <p>Always verify scripture references with your own Bible</p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{formatTime(item.timestamp)}</div>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-3 rounded-xl rounded-tl-sm w-fit shadow-sm">
                  <div className="h-2 w-2 bg-slate-300 rounded-full animate-pulse"></div>
                  <div
                    className="h-2 w-2 bg-slate-300 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="h-2 w-2 bg-slate-300 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="mt-4">
          <form onSubmit={handleSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your Bible question here..."
              className="w-full bg-slate-100 border border-slate-200 rounded-full py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
              disabled={!question.trim() || isLoading}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, BookOpen, BookText } from "lucide-react"
import Link from "next/link"

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Suggested search terms
  const suggestedTerms = [
    "love",
    "faith",
    "hope",
    "forgiveness",
    "prayer",
    "peace",
    "joy",
    "wisdom",
    "strength",
    "salvation",
  ]

  // Example natural language queries
  const exampleQueries = [
    "What does the Bible say about anxiety?",
    "How can I find peace in difficult times?",
    "Verses about God's promises",
    "Bible guidance for making decisions",
    "Overcoming fear with faith",
  ]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    setHasSearched(true)

    // Simulate search
    setTimeout(() => {
      setIsSearching(false)
    }, 1000)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="pt-12 pb-6 px-6">
        <h1 className="text-4xl font-extrabold tracking-tight mb-1">Search</h1>
        <p className="text-slate-500 text-lg">Find verses and studies</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-32">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search the Bible or ask a question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-slate-100 border-slate-200"
            />
            <Button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 px-3"
              disabled={!query.trim() || isSearching}
            >
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </form>

        {/* Suggested Topics */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Suggested Topics</h2>
          <div className="flex flex-wrap gap-2">
            {suggestedTerms.map((term) => (
              <Button
                key={term}
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery(term)
                  setTimeout(() => {
                    handleSearch({ preventDefault: () => {} } as React.FormEvent)
                  }, 100)
                }}
                className="bg-slate-100 border-slate-200 hover:bg-slate-200"
              >
                {term}
              </Button>
            ))}
          </div>
        </section>

        {/* Example Questions */}
        <section className="mb-8">
          <div className="flex items-center mb-4">
            <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
            <h2 className="text-2xl font-bold">Try asking a question</h2>
          </div>
          <div className="space-y-3">
            {exampleQueries.map((q, i) => (
              <button
                key={i}
                className="w-full text-left p-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm border border-slate-200 transition-colors"
                onClick={() => {
                  setQuery(q)
                  setTimeout(() => {
                    handleSearch({ preventDefault: () => {} } as React.FormEvent)
                  }, 100)
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/studies" className="block">
              <div className="bg-slate-100 rounded-xl p-5 h-32 flex flex-col justify-between transition-all hover:bg-slate-200">
                <BookOpen className="h-6 w-6 text-slate-900" />
                <div>
                  <h3 className="font-bold text-lg">Studies</h3>
                  <p className="text-slate-500 text-sm">Browse all studies</p>
                </div>
              </div>
            </Link>

            <Link href="/ask" className="block">
              <div className="bg-slate-100 rounded-xl p-5 h-32 flex flex-col justify-between transition-all hover:bg-slate-200">
                <BookText className="h-6 w-6 text-slate-900" />
                <div>
                  <h3 className="font-bold text-lg">Ask</h3>
                  <p className="text-slate-500 text-sm">Ask Bible questions</p>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

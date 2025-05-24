"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, BookOpen, BookText, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { searchStudies } from "@/lib/actions/study"
import type { Study } from "@/lib/actions/study"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<Study[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTopic, setActiveTopic] = useState<string | null>(null)

  // Suggested search terms - make sure they match the case from the homepage
  const suggestedTerms = [
    "Prayer",
    "Faith",
    "Hope",
    "Love",
    "Wisdom",
    "Grace",
    "Salvation",
    "peace",
    "joy",
    "strength",
  ]

  // Example natural language queries
  const exampleQueries = [
    "What does the Bible say about anxiety?",
    "How can I find peace in difficult times?",
    "Verses about God's promises",
    "Bible guidance for making decisions",
    "Overcoming fear with faith",
  ]

  // Handle URL parameters
  useEffect(() => {
    const queryParam = searchParams.get("q")
    const topicParam = searchParams.get("topic")

    if (topicParam) {
      // If we have a topic parameter, set it as active and trigger search
      setActiveTopic(topicParam)
      setHasSearched(true)
      setIsSearching(true)
      setError(null)
      setQuery("")

      // Perform the search
      searchStudies(topicParam, true)
        .then((result) => {
          if (result.error) {
            console.error("Search error:", result.error)
            setError("Failed to search studies. Please try again.")
            setSearchResults([])
            setActiveTopic(null)
          } else {
            setSearchResults(result.data || [])
          }
        })
        .catch((err) => {
          console.error("Search error:", err)
          setError("An unexpected error occurred. Please try again.")
          setSearchResults([])
          setActiveTopic(null)
        })
        .finally(() => {
          setIsSearching(false)
        })
    } else if (queryParam) {
      // For regular search parameter, set the query and search
      setQuery(queryParam)
      handleSearch({ preventDefault: () => {} } as React.FormEvent)
    }
  }, [searchParams])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    setHasSearched(true)
    setError(null)
    setActiveTopic(null) // Clear active topic when searching manually

    try {
      const result = await searchStudies(query.trim(), false)
      
      if (result.error) {
        console.error("Search error:", result.error)
        setError("Failed to search studies. Please try again.")
        setSearchResults([])
      } else {
        setSearchResults(result.data || [])
      }
    } catch (err) {
      console.error("Search error:", err)
      setError("An unexpected error occurred. Please try again.")
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleTopicClick = async (term: string) => {
    if (isSearching) return

    setActiveTopic(term) // Set active topic immediately
    setHasSearched(true)
    setIsSearching(true)
    setError(null)
    setQuery("") // Clear the search input when clicking a topic

    try {
      const result = await searchStudies(term, true)
      
      if (result.error) {
        console.error("Search error:", result.error)
        setError("Failed to search studies. Please try again.")
        setSearchResults([])
        setActiveTopic(null) // Clear active topic if search fails
      } else {
        setSearchResults(result.data || [])
      }
    } catch (err) {
      console.error("Search error:", err)
      setError("An unexpected error occurred. Please try again.")
      setSearchResults([])
      setActiveTopic(null) // Clear active topic if search fails
    } finally {
      setIsSearching(false)
    }
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
              placeholder="Search studies..."
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
                onClick={() => handleTopicClick(term)}
                className={`bg-slate-100 border-slate-200 hover:bg-slate-200 ${
                  activeTopic?.toLowerCase() === term.toLowerCase() ? "bg-slate-900 text-white hover:bg-slate-900" : ""
                }`}
              >
                {term}
              </Button>
            ))}
          </div>
        </section>

        {/* Search Results */}
        {hasSearched && (
          <section className="mb-8">
            {error ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg">
                {error}
              </div>
            ) : isSearching ? (
              <div className="text-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-600">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-4">
                {searchResults.map((study) => (
                  <Link key={study.id} href={`/studies/${study.id}`} className="block">
                    <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-xl">{study.title}</h3>
                        <span className="text-slate-500 text-sm">{study.readTime}</span>
                      </div>
                      <p className="text-slate-600 mb-3">{study.context?.substring(0, 120)}...</p>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-sm">{study.verses.join(", ")}</span>
                        <span className="text-primary text-sm font-medium flex items-center">
                          View study
                          <ArrowRight className="h-3.5 w-3.5 ml-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No studies found</h3>
                <p className="text-slate-500">We couldn't find any studies matching your search criteria.</p>
              </div>
            )}
          </section>
        )}

        {/* Example Questions */}
        <section>
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
                  router.push(`/ask?q=${encodeURIComponent(q)}`)
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-8">
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

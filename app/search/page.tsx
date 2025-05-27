"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Sparkles, BookOpen, BookText, ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { searchStudies } from "@/lib/actions/study"
import { searchBible } from "@/lib/bible-api"
import type { Study } from "@/lib/actions/study"
import { VerseDisplay } from "@/components/verse-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUserPreferences } from "@/contexts/user-preferences"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { preferences } = useUserPreferences()
  const [query, setQuery] = useState("")
  const [translation, setTranslation] = useState(preferences.preferredTranslation)
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [studyResults, setStudyResults] = useState<Study[]>([])
  const [verseResults, setVerseResults] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTopic, setActiveTopic] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "verses" | "studies">("all")

  // Update translation when preferred translation changes
  useEffect(() => {
    setTranslation(preferences.preferredTranslation)
  }, [preferences.preferredTranslation])

  // Handle URL parameters
  useEffect(() => {
    const queryParam = searchParams.get("q")
    const topicParam = searchParams.get("topic")

    if (topicParam) {
      // If we have a topic parameter, set it as active and trigger search
      setActiveTopic(topicParam)
      setQuery(topicParam) // Set the search input to the topic
      setHasSearched(true)
      setIsSearching(true)
      setError(null)

      // Perform the search
      Promise.all([
        searchStudies(topicParam, true),
        searchBible(topicParam, translation)
      ]).then(([studyResult, bibleResult]) => {
        if (studyResult.error) {
          console.error("Study search error:", studyResult.error)
          setError("Failed to search studies. Please try again.")
          setStudyResults([])
        } else {
          setStudyResults(studyResult.data || [])
        }

        setVerseResults(bibleResult.passages || [])

        // Set appropriate tab based on results
        if (bibleResult.passages?.length > 0 && !studyResult.data?.length) {
          setActiveTab("verses")
        } else if (!bibleResult.passages?.length && studyResult.data && studyResult.data.length > 0) {
          setActiveTab("studies")
        } else {
          setActiveTab("all")
        }

        setActiveTopic(null)
      }).catch((err) => {
        console.error("Search error:", err)
        setError("An unexpected error occurred. Please try again.")
        setStudyResults([])
        setVerseResults([])
        setActiveTopic(null)
      }).finally(() => {
        setIsSearching(false)
      })
    } else if (queryParam) {
      // For regular search parameter, set the query and search
      setQuery(queryParam)
      handleSearch({ preventDefault: () => {} } as React.FormEvent)
    }
  }, [searchParams, translation])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    setHasSearched(true)
    setError(null)
    setActiveTopic(null) // Clear active topic when searching manually
    setStudyResults([])
    setVerseResults([])

    try {
      // Perform both searches in parallel
      const [studyResult, bibleResult] = await Promise.all([
        searchStudies(query.trim(), false),
        searchBible(query.trim(), translation)
      ])

      if (studyResult.error) {
        console.error("Study search error:", studyResult.error)
        setError("Failed to search studies. Please try again.")
      } else {
        setStudyResults(studyResult.data || [])
      }

      setVerseResults(bibleResult.passages || [])

      // Set appropriate tab based on results
      if (bibleResult.passages?.length > 0 && !studyResult.data?.length) {
        setActiveTab("verses")
      } else if (!bibleResult.passages?.length && studyResult.data && studyResult.data.length > 0) {
        setActiveTab("studies")
      } else {
        setActiveTab("all")
      }

      // Show error if no results found
      if (!bibleResult.passages?.length && !studyResult.data?.length) {
        setError("No results found. Try different search terms.")
      }
    } catch (err) {
      console.error("Search error:", err)
      setError("An unexpected error occurred. Please try again.")
      setStudyResults([])
      setVerseResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleTopicClick = async (term: string) => {
    if (isSearching) return

    setActiveTopic(term) // Set active topic immediately
    setQuery(term) // Set the search input to the selected topic
    setHasSearched(true)
    setIsSearching(true)
    setError(null)
    setStudyResults([])
    setVerseResults([])

    try {
      // Perform both searches in parallel
      const [studyResult, bibleResult] = await Promise.all([
        searchStudies(term, true),
        searchBible(term, translation)
      ])

      if (studyResult.error) {
        console.error("Study search error:", studyResult.error)
        setError("Failed to search studies. Please try again.")
        setStudyResults([])
      } else {
        setStudyResults(studyResult.data || [])
      }

      setVerseResults(bibleResult.passages || [])

      // Set appropriate tab based on results
      if (bibleResult.passages?.length > 0 && !studyResult.data?.length) {
        setActiveTab("verses")
      } else if (!bibleResult.passages?.length && studyResult.data && studyResult.data.length > 0) {
        setActiveTab("studies")
      } else {
        setActiveTab("all")
      }

      setActiveTopic(null)
    } catch (err) {
      console.error("Search error:", err)
      setError("An unexpected error occurred. Please try again.")
      setStudyResults([])
      setVerseResults([])
      setActiveTopic(null)
    } finally {
      setIsSearching(false)
    }
  }

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

  // Calculate total results
  const totalResults = verseResults.length + studyResults.length

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="pt-6 pb-4 px-4 sm:pt-12 sm:pb-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-1">Search</h1>
            <p className="text-slate-500 text-base sm:text-lg">Find verses and studies</p>
          </div>
          <Select value={translation} onValueChange={setTranslation}>
            <SelectTrigger className="w-24 sm:w-32 text-sm sm:text-base h-9 sm:h-10">
              <SelectValue placeholder="Translation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ESV" className="text-sm sm:text-base">ESV</SelectItem>
              <SelectItem value="KJV" className="text-sm sm:text-base">KJV</SelectItem>
              <SelectItem value="NIV" className="text-sm sm:text-base">NIV</SelectItem>
              <SelectItem value="NASB" className="text-sm sm:text-base">NASB</SelectItem>
              <SelectItem value="NLT" className="text-sm sm:text-base">NLT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 pb-32">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
              <Input
                placeholder="Search studies and verses..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 bg-slate-100 border-slate-200 text-sm sm:text-base h-10 sm:h-11"
              />
            </div>
          </div>
        </form>

        {/* Suggested Topics */}
        <section className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Suggested Topics</h2>
          <div className="flex flex-wrap gap-2">
            {suggestedTerms.map((term) => (
              <Button
                key={term}
                variant="outline"
                size="sm"
                onClick={() => handleTopicClick(term)}
                className={`bg-slate-100 border-slate-200 hover:bg-slate-200 text-sm sm:text-base ${
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
          <section id="search-results" className="mb-8">
            {error ? (
              <div className="bg-red-50 text-red-800 p-4 rounded-lg text-sm sm:text-base">
                {error}
              </div>
            ) : isSearching ? (
              <div className="space-y-6">
                {/* Shimmer effect for studies */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm sm:text-base font-medium text-muted-foreground">
                    <BookText className="h-4 w-4 sm:h-5 sm:w-5" />
                    <h4>Bible Studies</h4>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-6 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                        <div className="h-4 w-full bg-slate-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse mb-3"></div>
                        <div className="flex justify-between items-center">
                          <div className="h-4 w-1/3 bg-slate-200 rounded animate-pulse"></div>
                          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shimmer effect for verses */}
                <div>
                  <div className="flex items-center gap-2 mb-2 text-sm sm:text-base font-medium text-muted-foreground">
                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                    <h4>Bible Verses</h4>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-5 w-1/4 bg-slate-200 rounded animate-pulse"></div>
                          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse"></div>
                        </div>
                        <div className="h-4 w-full bg-slate-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-2/3 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : totalResults > 0 ? (
              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="all" className="text-sm sm:text-base">All Results ({totalResults})</TabsTrigger>
                  <TabsTrigger value="verses" className="text-sm sm:text-base">Verses ({verseResults.length})</TabsTrigger>
                  <TabsTrigger value="studies" className="text-sm sm:text-base">Studies ({studyResults.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-6">
                  {/* Show studies first */}
                  {studyResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-sm sm:text-base font-medium text-muted-foreground">
                        <BookText className="h-4 w-4 sm:h-5 sm:w-5" />
                        <h4>Bible Studies</h4>
                      </div>
                      <div className="space-y-4">
                        {studyResults.map((study) => (
                          <Link key={study.id} href={`/studies/${study.id}`} className="block">
                            <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg sm:text-xl">{study.title}</h3>
                                <span className="text-slate-500 text-xs sm:text-sm">{study.readTime}</span>
                              </div>
                              <p className="text-slate-600 mb-3 text-sm sm:text-base">{study.context?.substring(0, 120)}...</p>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 text-xs sm:text-sm">{study.verses.join(", ")}</span>
                                <span className="hidden sm:flex items-center text-primary text-xs sm:text-sm font-medium">
                                  View study
                                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Then show verses */}
                  {verseResults.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 text-sm sm:text-base font-medium text-muted-foreground">
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5" />
                        <h4>Bible Verses</h4>
                      </div>
                      <div className="space-y-4">
                        {verseResults.map((verse, index) => (
                          <VerseDisplay
                            key={index}
                            reference={verse.reference}
                            translation={translation}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="verses" className="space-y-4">
                  {verseResults.length > 0 ? (
                    <div className="space-y-4">
                      {verseResults.map((verse, index) => (
                        <VerseDisplay
                          key={index}
                          reference={verse.reference}
                          translation={translation}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg sm:text-xl font-semibold mb-2">No verse results</h3>
                      <p className="text-muted-foreground mb-4 text-sm sm:text-base">Try different search terms or check the Studies tab.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="studies" className="space-y-4">
                  {studyResults.length > 0 ? (
                    <div className="space-y-4">
                      {studyResults.map((study) => (
                        <Link key={study.id} href={`/studies/${study.id}`} className="block">
                          <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-lg sm:text-xl">{study.title}</h3>
                              <span className="text-slate-500 text-xs sm:text-sm">{study.readTime}</span>
                            </div>
                            <p className="text-slate-600 mb-3 text-sm sm:text-base">{study.context?.substring(0, 120)}...</p>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-xs sm:text-sm">{study.verses.join(", ")}</span>
                              <span className="hidden sm:flex items-center text-primary text-xs sm:text-sm font-medium">
                                View study
                                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookText className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg sm:text-xl font-semibold mb-2">No study results</h3>
                      <p className="text-muted-foreground mb-4 text-sm sm:text-base">Try different search terms or check the Verses tab.</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-2">No results found</h3>
                <p className="text-slate-500 text-sm sm:text-base">We couldn't find any studies or verses matching your search criteria.</p>
              </div>
            )}
          </section>
        )}

        {/* Example Questions */}
        <section>
          <div className="flex items-center mb-4">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-bold">Try asking a question</h2>
          </div>
          <div className="space-y-3">
            {exampleQueries.map((q, i) => (
              <button
                key={i}
                className="w-full text-left p-4 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm sm:text-base border border-slate-200 transition-colors"
                onClick={async () => {
                  setQuery(q)
                  setIsSearching(true)
                  setHasSearched(true)
                  setError(null)
                  setActiveTopic(null)
                  setStudyResults([])
                  setVerseResults([])

                  // Scroll to top of the page
                  window.scrollTo({ top: 0, behavior: 'smooth' })

                  try {
                    // Perform both searches in parallel
                    const [studyResult, bibleResult] = await Promise.all([
                      searchStudies(q, false),
                      searchBible(q, translation)
                    ])

                    if (studyResult.error) {
                      console.error("Study search error:", studyResult.error)
                      setError("Failed to search studies. Please try again.")
                    } else {
                      setStudyResults(studyResult.data || [])
                    }

                    setVerseResults(bibleResult.passages || [])

                    // Set appropriate tab based on results
                    if (bibleResult.passages?.length > 0 && !studyResult.data?.length) {
                      setActiveTab("verses")
                    } else if (!bibleResult.passages?.length && studyResult.data && studyResult.data.length > 0) {
                      setActiveTab("studies")
                    } else {
                      setActiveTab("all")
                    }

                    // Show error if no results found
                    if (!bibleResult.passages?.length && !studyResult.data?.length) {
                      setError("No results found. Try different search terms.")
                    }
                  } catch (err) {
                    console.error("Search error:", err)
                    setError("An unexpected error occurred. Please try again.")
                    setStudyResults([])
                    setVerseResults([])
                  } finally {
                    setIsSearching(false)
                  }
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/studies" className="block">
              <div className="bg-slate-100 rounded-xl p-4 sm:p-5 h-28 sm:h-32 flex flex-col justify-between transition-all hover:bg-slate-200">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-slate-900" />
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Studies</h3>
                  <p className="text-slate-500 text-xs sm:text-sm">Browse all studies</p>
                </div>
              </div>
            </Link>

            <Link href="/ask" className="block">
              <div className="bg-slate-100 rounded-xl p-4 sm:p-5 h-28 sm:h-32 flex flex-col justify-between transition-all hover:bg-slate-200">
                <BookText className="h-6 w-6 sm:h-8 sm:w-8 text-slate-900" />
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Ask</h3>
                  <p className="text-slate-500 text-xs sm:text-sm">Ask Bible questions</p>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}

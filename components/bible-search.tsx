"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { searchBible, searchStudies } from "@/lib/bible-api"
import { ScriptureCard } from "@/components/scripture-card"
import { Search, Loader2, AlertCircle, Sparkles, BookOpen, BookText, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUserPreferences } from "@/contexts/user-preferences"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { StudyCard } from "@/components/ui/study-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function BibleSearch() {
  const { preferences } = useUserPreferences()
  const [query, setQuery] = useState("")
  const [translation, setTranslation] = useState(preferences.preferredTranslation)
  const [verseResults, setVerseResults] = useState<any[]>([])
  const [studyResults, setStudyResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAiRecommended, setIsAiRecommended] = useState(false)
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "ai-searching" | "complete">("idle")
  const [activeTab, setActiveTab] = useState<"all" | "verses" | "studies">("all")

  // Update translation when preferred translation changes
  useEffect(() => {
    setTranslation(preferences.preferredTranslation)
  }, [preferences.preferredTranslation])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isSearching) return

    setIsSearching(true)
    setHasSearched(true)
    setError(null)
    setIsAiRecommended(false)
    setSearchStatus("searching")
    setVerseResults([])
    setStudyResults([])

    try {
      // Search for Bible verses
      const bibleSearchPromise = searchBible(query, translation).catch((error) => {
        console.error("Bible search failed:", error)
        return { passages: [] } // Return empty passages on error
      })

      // Search for studies
      const studySearchPromise = Promise.resolve(searchStudies(query))

      // Wait for both searches to complete
      const [bibleSearchResults, studySearchResults] = await Promise.all([bibleSearchPromise, studySearchPromise])

      // Update state based on results
      setVerseResults(bibleSearchResults.passages || [])
      setStudyResults(studySearchResults || [])

      if (bibleSearchResults.isAiRecommended) {
        setIsAiRecommended(true)
      }

      // Set appropriate tab based on results
      if (bibleSearchResults.passages.length > 0 && studySearchResults.length === 0) {
        setActiveTab("verses")
      } else if (bibleSearchResults.passages.length === 0 && studySearchResults.length > 0) {
        setActiveTab("studies")
      } else {
        setActiveTab("all")
      }

      // Show error if no results found
      if (bibleSearchResults.passages.length === 0 && studySearchResults.length === 0) {
        setError("No results found. Try different search terms.")
      }

      setSearchStatus("complete")
    } catch (error) {
      console.error("Search error:", error)
      setError("There was an error searching. Please try again.")

      // Try to at least show study results if Bible search failed
      try {
        const studyResults = searchStudies(query)
        if (studyResults.length > 0) {
          setStudyResults(studyResults)
          setActiveTab("studies")
          setError("Bible verse search failed, but we found some relevant studies.")
        }
      } catch (studyError) {
        console.error("Study search also failed:", studyError)
      }
    } finally {
      setIsSearching(false)
    }
  }

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

  // Calculate total results
  const totalResults = verseResults.length + studyResults.length

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search the Bible, studies, or ask a question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={translation} onValueChange={setTranslation}>
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
          <Button type="submit" disabled={isSearching || !query.trim()}>
            {isSearching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Searching...
              </>
            ) : (
              "Search"
            )}
          </Button>
        </div>
      </form>

      {!hasSearched && (
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Suggested topics:</h3>
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
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-gold-500" />
              Try asking a question:
            </h3>
            <div className="flex flex-col gap-2">
              {exampleQueries.map((q, i) => (
                <button
                  key={i}
                  className="text-left p-2 bg-slate-50 hover:bg-slate-100 rounded-md text-sm border border-slate-200 transition-colors"
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
          </div>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {error && (
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Search Issue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSearching ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">
              {searchStatus === "ai-searching" ? "Finding relevant content with AI..." : "Searching..."}
            </p>
          </div>
        ) : totalResults > 0 ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Results for "{query}"</h3>
              <div className="flex items-center gap-2">
                {isAiRecommended && (
                  <div className="flex items-center gap-1 text-xs bg-gold-100 text-gold-800 px-2 py-1 rounded-full">
                    <Sparkles className="h-3 w-3" />
                    <span>AI-recommended</span>
                  </div>
                )}
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filter</span>
                </Button>
              </div>
            </div>

            {isAiRecommended && (
              <Alert className="mb-4 bg-gold-50 border-gold-200">
                <Sparkles className="h-4 w-4 text-gold-500" />
                <AlertTitle>AI-Powered Results</AlertTitle>
                <AlertDescription>
                  These verses were recommended by our AI based on your search. They may provide insight into your
                  question.
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="all">All Results ({totalResults})</TabsTrigger>
                <TabsTrigger value="verses">Verses ({verseResults.length})</TabsTrigger>
                <TabsTrigger value="studies">Studies ({studyResults.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                {/* Show studies first */}
                {studyResults.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                      <BookText className="h-4 w-4" />
                      <h4>Bible Studies</h4>
                    </div>
                    <div className="space-y-3">
                      {studyResults.slice(0, 2).map((study, index) => (
                        <StudyCard
                          key={index}
                          id={study.id}
                          title={study.title}
                          description={study.description}
                          verses={study.verses}
                          category={study.category}
                        />
                      ))}
                      {studyResults.length > 2 && (
                        <Button
                          variant="ghost"
                          className="w-full text-sm text-muted-foreground"
                          onClick={() => setActiveTab("studies")}
                        >
                          View {studyResults.length - 2} more studies
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Then show verses */}
                {verseResults.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <h4>Bible Verses</h4>
                    </div>
                    <div className="space-y-3">
                      {verseResults.slice(0, 3).map((passage, index) => (
                        <ScriptureCard
                          key={index}
                          reference={passage.reference}
                          translation={translation}
                          text={typeof passage.text === "string" ? passage.text.replace(/<[^>]*>/g, "") : passage.text}
                          copyright={passage.copyright}
                        />
                      ))}
                      {verseResults.length > 3 && (
                        <Button
                          variant="ghost"
                          className="w-full text-sm text-muted-foreground"
                          onClick={() => setActiveTab("verses")}
                        >
                          View {verseResults.length - 3} more verses
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="verses" className="space-y-4">
                {verseResults.length > 0 ? (
                  <div className="space-y-3">
                    {verseResults.map((passage, index) => (
                      <ScriptureCard
                        key={index}
                        reference={passage.reference}
                        translation={translation}
                        text={typeof passage.text === "string" ? passage.text.replace(/<[^>]*>/g, "") : passage.text}
                        copyright={passage.copyright}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No verse results</h3>
                    <p className="text-muted-foreground mb-4">Try different search terms or check the Studies tab.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="studies" className="space-y-4">
                {studyResults.length > 0 ? (
                  <div className="space-y-3">
                    {studyResults.map((study, index) => (
                      <StudyCard
                        key={index}
                        id={study.id}
                        title={study.title}
                        description={study.description}
                        verses={study.verses}
                        category={study.category}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BookText className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No study results</h3>
                    <p className="text-muted-foreground mb-4">Try different search terms or check the Verses tab.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : hasSearched && !error ? (
          <div className="text-center py-8">
            <Search className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-muted-foreground mb-4">Try using different keywords or check your spelling.</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedTerms.slice(0, 5).map((term) => (
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
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

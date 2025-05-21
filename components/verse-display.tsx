"use client"

import { useEffect, useState } from "react"
import { ScriptureCard } from "./scripture-card"
import { fetchVerse, type VerseResponse } from "@/lib/bible-api"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface VerseDisplayProps {
  reference: string
  translation?: string
  onTranslationChange?: (translation: string) => void
  showTranslationSelector?: boolean
}

export function VerseDisplay({
  reference,
  translation = "ESV",
  onTranslationChange,
  showTranslationSelector = false,
}: VerseDisplayProps) {
  const [verse, setVerse] = useState<VerseResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [selectedTranslation, setSelectedTranslation] = useState(translation)

  useEffect(() => {
    setSelectedTranslation(translation)
  }, [translation])

  useEffect(() => {
    async function loadVerse() {
      try {
        setIsLoading(true)
        setError(null)
        const response = await fetchVerse(reference, selectedTranslation)

        if (response.error) {
          setError(response.error)
        } else {
          setVerse(response)
        }
      } catch (err) {
        console.error("Error loading verse:", err)
        setError("Failed to load verse. Using offline fallback.")

        // Create a fallback verse when all else fails
        setVerse({
          reference,
          translation: selectedTranslation,
          text: "Scripture text is temporarily unavailable. Please check your Bible for this verse.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Reset error state when reference or translation changes
    setError(null)
    loadVerse()
  }, [reference, selectedTranslation, retryCount])

  const handleTranslationChange = (value: string) => {
    setSelectedTranslation(value)
    if (onTranslationChange) {
      onTranslationChange(value)
    }
  }

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  return (
    <div className="verse-container">
      {showTranslationSelector && (
        <div className="mb-2 flex justify-end">
          <Select value={selectedTranslation} onValueChange={handleTranslationChange}>
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
      )}
      <ScriptureCard
        reference={reference}
        translation={verse?.translation || selectedTranslation}
        text={verse?.text}
        isLoading={isLoading}
        error={error || undefined}
        copyright={verse?.copyright}
        onRetry={handleRetry}
      />
    </div>
  )
}

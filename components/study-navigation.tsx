"use client"

import { Bookmark, Heart, Share2, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

export function StudyNavigation() {
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)

  return (
    <div className="study-navigation">
      <div className="action-buttons">
        <button
          className={`action-button ${bookmarked ? "active" : ""}`}
          onClick={() => setBookmarked(!bookmarked)}
          aria-label="Bookmark"
        >
          <Bookmark className="action-icon" fill={bookmarked ? "currentColor" : "none"} />
        </button>
        <button className={`action-button ${liked ? "active" : ""}`} onClick={() => setLiked(!liked)} aria-label="Like">
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
  )
}

"use client"

import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { BookOpen, Clock } from "lucide-react"
import Link from "next/link"

interface StudyCardProps {
  id: string
  title: string
  description?: string
  verses: string | string[]
  category?: string
  date?: string
  className?: string
  likes?: number
  isPublic?: boolean
  onClick?: () => void
}

export function StudyCard({ 
  id, 
  title, 
  description, 
  verses, 
  category, 
  date, 
  className,
  likes = 0,
  isPublic = true,
  onClick 
}: StudyCardProps) {
  const versesText = Array.isArray(verses) ? verses.join(", ") : verses

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the like button
    if ((e.target as HTMLElement).closest(".like-button-container")) {
      e.preventDefault();
      return;
    }
    
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link href={`/studies/${id}`} onClick={handleCardClick}>
      <Card className={cn("card-hover", className)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-serif">{title}</CardTitle>
            <div className="flex items-center gap-2">
              {!isPublic && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  Private
                </span>
              )}
              {category && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {category}
                </span>
              )}
            </div>
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardFooter className="pt-0 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{versesText}</span>
          </div>
          <div className="flex items-center gap-3">
            {date && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{date}</span>
              </div>
            )}
            <div className="like-button-container" onClick={(e) => e.stopPropagation()}>
           
            </div>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}

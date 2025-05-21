import { cn } from "@/lib/utils"
import { Book } from "lucide-react"

interface VerseCardProps {
  reference: string
  text: string
  className?: string
}

export function VerseCard({ reference, text, className }: VerseCardProps) {
  return (
    <div className={cn("bible-verse group", className)}>
      <div className="flex items-center gap-2 bible-verse-reference">
        <Book className="h-3.5 w-3.5 text-gold-600" />
        <span>{reference}</span>
      </div>
      <p className="bible-verse-text mt-1">{text}</p>
    </div>
  )
}

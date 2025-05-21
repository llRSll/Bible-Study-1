import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Clock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface StudyCardProps {
  id: string
  title: string
  description?: string
  verses: string | string[]
  category?: string
  date?: string
  className?: string
}

export function StudyCard({ id, title, description, verses, category, date, className }: StudyCardProps) {
  const versesText = Array.isArray(verses) ? verses.join(", ") : verses

  return (
    <Link href={`/studies/${id}`}>
      <Card className={cn("card-hover", className)}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg font-serif">{title}</CardTitle>
            {category && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{category}</span>}
          </div>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardFooter className="pt-0 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>{versesText}</span>
          </div>
          {date && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{date}</span>
            </div>
          )}
        </CardFooter>
      </Card>
    </Link>
  )
}

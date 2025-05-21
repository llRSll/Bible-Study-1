import { ChevronLeft } from "lucide-react"
import Link from "next/link"

interface StudyHeaderProps {
  title: string
  backLink?: string
}

export function StudyHeader({ title, backLink = "/studies" }: StudyHeaderProps) {
  return (
    <div className="app-header">
      <Link href={backLink} className="back-button">
        <ChevronLeft className="h-6 w-6" />
      </Link>
      <h1 className="header-title">{title}</h1>
    </div>
  )
}

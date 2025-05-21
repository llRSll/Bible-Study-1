import type React from "react"
interface StudySectionProps {
  title: string
  children: React.ReactNode
}

export function StudySection({ title, children }: StudySectionProps) {
  return (
    <div className="study-section">
      <h3 className="study-section-title">{title}</h3>
      <div className="study-section-content">{children}</div>
    </div>
  )
}

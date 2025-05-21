import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface SectionHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  className?: string
}

export function SectionHeader({ title, description, icon: Icon, className }: SectionHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <h2 className="text-xl font-semibold flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        {title}
      </h2>
      {description && <p className="text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}

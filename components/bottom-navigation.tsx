"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, Search, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"

export default function BottomNavigation() {
  const pathname = usePathname()

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Studies",
      href: "/studies",
      icon: BookOpen,
    },
    {
      name: "Search",
      href: "/search",
      icon: Search,
    },
    {
      name: "Ask",
      href: "/ask",
      icon: MessageSquare,
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50">
      <div className="flex justify-around items-center h-14">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full",
                isActive ? "text-primary" : "text-slate-400",
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
              <span className={cn("text-xs mt-0.5", isActive ? "font-medium" : "font-normal")}>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

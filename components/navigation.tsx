"use client"

import { Home, BookOpen, Search, MessageSquare, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Navigation() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/studies", label: "Study", icon: BookOpen },
    { href: "/search", label: "Search", icon: Search },
    { href: "/ask", label: "Ask", icon: MessageSquare },
    { href: "/profile", label: "Profile", icon: Settings },
  ]

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
        const Icon = item.icon

        return (
          <Link key={item.href} href={item.href} className={`nav-item ${isActive ? "active" : ""}`}>
            <Icon className="nav-icon" />
            <span className="nav-text">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

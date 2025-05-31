"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, BookOpen, Search, MessageSquare, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

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
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-10"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 200, 
        damping: 20,
        delay: 0.3
      }}
    >
      <div className="flex justify-around items-center h-14">
        {navItems.map((item, index) => {
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
              <motion.div
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  delay: 0.1 * (index + 1),
                  type: "spring",
                  stiffness: 400 
                }}
                className="flex flex-col items-center"
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-slate-400")} />
                <span className={cn("text-xs mt-0.5", isActive ? "font-medium" : "font-normal")}>{item.name}</span>
                {isActive && (
                  <motion.div
                    className="h-1 w-1 bg-primary rounded-full mt-1"
                    layoutId="activeIndicator"
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                )}
              </motion.div>
            </Link>
          )
        })}
      </div>
    </motion.nav>
  )
}

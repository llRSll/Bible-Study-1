"use client"

import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MoonStar, Sun, ChevronLeft, Book } from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Add the import for useUserPreferences and Dialog components
import { useUserPreferences } from "@/contexts/user-preferences"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Update the Header component to include a quick settings button
export default function Header() {
  const { setTheme, theme } = useTheme()
  const { preferences, updatePreference } = useUserPreferences()
  const pathname = usePathname()

  // Don't show back button on main pages
  const showBackButton = !["/", "/studies", "/search", "/ask", "/profile"].includes(pathname)

  // Get page title based on pathname
  const getPageTitle = () => {
    if (pathname === "/") return "Home"
    if (pathname === "/studies") return "Studies"
    if (pathname === "/studies/new") return "Create Study"
    if (pathname.startsWith("/studies/")) return "Bible Study"
    if (pathname === "/search") return "Search"
    if (pathname === "/ask") return "Ask a Question"
    if (pathname === "/profile") return "Profile"
    return "Faithful Study"
  }

  // Add a quick settings dialog before the theme toggle button
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex flex-1 items-center justify-between">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button variant="ghost" size="icon" asChild className="mr-1">
                <Link href={pathname.split("/").slice(0, -1).join("/") || "/"}>
                  <ChevronLeft className="h-5 w-5" />
                  <span className="sr-only">Back</span>
                </Link>
              </Button>
            )}
            <div className={cn("flex items-center", showBackButton ? "" : "")}>
              {!showBackButton && (
                <div className="hidden sm:flex mr-2">
                  <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
                    <span className="text-white font-serif font-bold text-lg">F</span>
                  </div>
                </div>
              )}
              <h1 className={cn("font-serif text-lg font-medium", !showBackButton && "gradient-text")}>
                {getPageTitle()}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-1">
                  <Book className="h-5 w-5" />
                  <span className="sr-only">Bible Settings</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bible Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="quick-translation">Preferred Translation</Label>
                    <Select
                      value={preferences.preferredTranslation}
                      onValueChange={(value) => updatePreference("preferredTranslation", value)}
                    >
                      <SelectTrigger id="quick-translation">
                        <SelectValue placeholder="Select translation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ESV">English Standard Version (ESV)</SelectItem>
                        <SelectItem value="KJV">King James Version (KJV)</SelectItem>
                        <SelectItem value="NIV">New International Version (NIV)</SelectItem>
                        <SelectItem value="NASB">New American Standard Bible (NASB)</SelectItem>
                        <SelectItem value="NLT">New Living Translation (NLT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

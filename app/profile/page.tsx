"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Heart, Clock, Settings, Bell, Shield, Moon, Book, LogOut } from "lucide-react"
import Link from "next/link"
import { useUserPreferences } from "@/contexts/user-preferences"

// Default preferences as fallback
const defaultPreferences = {
  preferredTranslation: "ESV",
  fontSize: "medium",
  darkMode: false,
  saveHistory: true,
}

export default function ProfilePage() {
  // Use a try-catch at the component level to handle potential context errors
  const { preferences, updatePreference } = useUserPreferences()
  const contextPreferences = preferences || defaultPreferences
  const contextUpdatePreference = updatePreference || ((_key: string, _value: any) => {})

  const [isClient, setIsClient] = useState(false)

  // Only run client-side code after component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  const savedStudies = [
    {
      id: "1",
      title: "The Beatitudes",
      date: "2 days ago",
      verses: "Matthew 5:1-12",
    },
    {
      id: "2",
      title: "Faith of Abraham",
      date: "1 week ago",
      verses: "Genesis 12-22",
    },
  ]

  const recentStudies = [
    {
      id: "3",
      title: "Fruits of the Spirit",
      date: "Today",
      verses: "Galatians 5:22-23",
    },
    {
      id: "1",
      title: "The Beatitudes",
      date: "2 days ago",
      verses: "Matthew 5:1-12",
    },
  ]

  // Add a handler for translation change
  const handleTranslationChange = (translation: string) => {
    contextUpdatePreference("preferredTranslation", translation)
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="pt-12 pb-6 px-6">
        <h1 className="text-4xl font-extrabold tracking-tight mb-1">Profile</h1>
        <p className="text-slate-500 text-lg">Manage your account</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-32">
        {/* User Card */}
        <section className="mb-8">
          <Card className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="h-8 w-8 text-slate-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Guest User</h2>
                <p className="text-slate-500">Create an account to sync your studies across devices</p>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <Button className="flex-1">Sign Up</Button>
              <Button variant="outline" className="flex-1">
                Log In
              </Button>
            </div>
          </Card>
        </section>

        {/* Saved Studies */}
        <section className="mb-8">
          <div className="flex items-center mb-4">
            <Heart className="h-5 w-5 mr-2 text-slate-900" />
            <h2 className="text-2xl font-bold">Saved Studies</h2>
          </div>

          {savedStudies.length > 0 ? (
            <div className="space-y-4">
              {savedStudies.map((study) => (
                <Link key={study.id} href={`/studies/${study.id}`} className="block">
                  <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                    <h3 className="font-bold text-xl mb-2">{study.title}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">{study.verses}</span>
                      <span className="text-slate-500 text-sm">{study.date}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
              <Heart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-xl font-semibold mb-2">No saved studies yet</h3>
              <p className="text-slate-500 mb-4">Save your favorite studies to access them anytime</p>
              <Button asChild>
                <Link href="/studies">Browse Studies</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Recent Studies */}
        <section className="mb-8">
          <div className="flex items-center mb-4">
            <Clock className="h-5 w-5 mr-2 text-slate-900" />
            <h2 className="text-2xl font-bold">Recent Studies</h2>
          </div>

          {recentStudies.length > 0 ? (
            <div className="space-y-4">
              {recentStudies.map((study) => (
                <Link key={study.id} href={`/studies/${study.id}`} className="block">
                  <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                    <h3 className="font-bold text-xl mb-2">{study.title}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">{study.verses}</span>
                      <span className="text-slate-500 text-sm">{study.date}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
              <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-xl font-semibold mb-2">No recent studies</h3>
              <p className="text-slate-500 mb-4">Your recently viewed studies will appear here</p>
              <Button asChild>
                <Link href="/studies">Browse Studies</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Settings */}
        {isClient && (
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 mr-2 text-slate-900" />
              <h2 className="text-2xl font-bold">Settings</h2>
            </div>

            {/* Bible Preferences */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Book className="h-5 w-5 text-slate-900" />
                <h3 className="text-lg font-semibold">Bible Preferences</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="preferred-translation" className="font-medium mb-2 block">
                    Preferred Translation
                  </Label>
                  <Select value={contextPreferences.preferredTranslation} onValueChange={handleTranslationChange}>
                    <SelectTrigger id="preferred-translation" className="w-full bg-slate-50 border-slate-200">
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

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="large-text" className="font-medium">
                      Large Bible Text
                    </Label>
                    <p className="text-sm text-slate-500">Increase the size of Bible verses</p>
                  </div>
                  <Switch
                    id="large-text"
                    checked={contextPreferences.fontSize === "large"}
                    onCheckedChange={(checked) => contextUpdatePreference("fontSize", checked ? "large" : "medium")}
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Moon className="h-5 w-5 text-slate-900" />
                <h3 className="text-lg font-semibold">Appearance</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode" className="font-medium">
                      Dark Mode
                    </Label>
                    <p className="text-sm text-slate-500">Use dark theme</p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={contextPreferences.darkMode}
                    onCheckedChange={(checked) => contextUpdatePreference("darkMode", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="large-text-ui" className="font-medium">
                      Large Text
                    </Label>
                    <p className="text-sm text-slate-500">Increase text size throughout the app</p>
                  </div>
                  <Switch id="large-text-ui" />
                </div>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm mb-4">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="h-5 w-5 text-slate-900" />
                <h3 className="text-lg font-semibold">Notifications</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="daily-verse" className="font-medium">
                      Daily Verse
                    </Label>
                    <p className="text-sm text-slate-500">Receive a daily Bible verse</p>
                  </div>
                  <Switch id="daily-verse" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="study-reminders" className="font-medium">
                      Study Reminders
                    </Label>
                    <p className="text-sm text-slate-500">Get reminders to continue your studies</p>
                  </div>
                  <Switch id="study-reminders" />
                </div>
              </div>
            </div>

            {/* Privacy */}
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-5 w-5 text-slate-900" />
                <h3 className="text-lg font-semibold">Privacy</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="save-history" className="font-medium">
                      Save Search History
                    </Label>
                    <p className="text-sm text-slate-500">Save your search history for quick access</p>
                  </div>
                  <Switch
                    id="save-history"
                    checked={contextPreferences.saveHistory}
                    onCheckedChange={(checked) => contextUpdatePreference("saveHistory", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="analytics" className="font-medium">
                      Usage Analytics
                    </Label>
                    <p className="text-sm text-slate-500">Help improve the app by sharing usage data</p>
                  </div>
                  <Switch id="analytics" />
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 text-red-500 border-red-100 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </section>
        )}
      </main>
    </div>
  )
}

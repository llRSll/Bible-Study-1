"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { useUserPreferences } from "@/contexts/user-preferences"
import { getUserProfile, updateProfile, uploadProfilePicture } from "@/lib/actions/profile"
import { formatDistanceToNow } from "date-fns"
import { ArrowRight, Bell, Book, Clock, Edit, Heart, Loader2, LogOut, Moon, Settings, Shield, Upload, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { motion } from "framer-motion"

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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const [isClient, setIsClient] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        const result = await getUserProfile()
        if (result.error) {
          console.error("Error fetching profile:", result.error)
        } else if (result.data) {
          setProfileData(result.data)
          setFullName(result.data.full_name || "")
        }
      } catch (err) {
        console.error("Error fetching profile:", err)
      } finally {
        setLoading(false)
        setIsClient(true)
      }
    }

    fetchProfile()
  }, [])

  // Helper to format date for studies
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch (e) {
      return "Recently"
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image",
        variant: "destructive",
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = "" // Reset file input
      }
      return
    }
    
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive",
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = "" // Reset file input
      }
      return
    }

    setSelectedImage(file)
  }

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const formData = new FormData()
      formData.append("full_name", fullName)
      
      // Add the selected image if any
      if (selectedImage) {
        formData.append("profile_picture", selectedImage)
      }
      
      const result = await updateProfile(formData)
      
      if (result.error) {
        toast({
          title: "Error updating profile",
          description: result.error.message || "An error occurred",
          variant: "destructive",
        })
      } else {
        setProfileData(result.data)
        setIsEditing(false)
        setSelectedImage(null)
        if (fileInputRef.current) {
          fileInputRef.current.value = "" // Reset file input
        }
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        })
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      toast({
        title: "Error updating profile",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Add a handler for translation change
  const handleTranslationChange = (translation: string) => {
    contextUpdatePreference("preferredTranslation", translation)
  }

  // Handle logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const { createClient } = await import('@/utils/supabase/client');
      const supabase = createClient();
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Error logging out",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
        setLoggingOut(false);
      } else {
        toast({
          title: "Logged out successfully",
          description: "You have been logged out of your account"
        });
        // Redirect to login page
        window.location.href = 'auth/login';
      }
    } catch (err) {
      console.error("Error during logout:", err);
      toast({
        title: "Error logging out",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      setLoggingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-slate-500">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="pt-6 sm:pt-12 pb-4 sm:pb-6 px-4 sm:px-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-1">Profile</h1>
          <p className="text-sm sm:text-lg text-slate-500">Manage your account</p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-slate-700"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <>
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              <span className="hidden sm:inline">Logging out...</span>
              <span className="sm:hidden">Logout...</span>
            </>
          ) : (
            <>
              <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Log out</span>
              <span className="sm:hidden">Logout</span>
            </>
          )}
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 pb-20 sm:pb-32">
        {/* User Card */}
        <section className="mb-6 sm:mb-8">
          <Card className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="relative">
                <div className={`h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden ${isEditing ? 'cursor-pointer' : ''}`} onClick={isEditing ? () => fileInputRef.current?.click() : undefined}>
                  {(profileData?.profile_picture || selectedImage) ? (
                    <Image 
                      src={selectedImage ? URL.createObjectURL(selectedImage) : profileData.profile_picture} 
                      alt="Profile" 
                      width={64} 
                      height={64} 
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        // If image fails to load, show fallback icon
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'flex';
                        }
                      }}
                    />
                  ) : (
                    <User className="h-6 w-6 sm:h-8 sm:w-8 text-slate-400 fallback-icon" />
                  )}
                  {isEditing && !isSaving && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <Edit className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Hidden file input for profile picture upload */}
                <input 
                  name="profile_picture"
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={!isEditing || isSaving}
                />
              </div>
              
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="flex-1">
                  <div className="mb-4">
                    <Input 
                      id="full_name" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1"
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => {
                        setIsEditing(false)
                        setSelectedImage(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                        setFullName(profileData?.full_name || "")
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving} className="min-w-[100px]">
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save'
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold">{profileData?.full_name || "Anonymous User"}</h2>
                      <p className="text-sm sm:text-base text-slate-500">{profileData?.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-sm sm:text-base">
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Saved Studies */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center mb-3 sm:mb-4">
            <Heart className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-slate-900" />
            <h2 className="text-xl sm:text-2xl font-bold">Saved Studies</h2>
          </div>

          {profileData?.savedStudiesData && profileData.savedStudiesData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 sm:space-y-4"
            >
              {profileData.savedStudiesData.map((study: any) => (
                <Link key={study.id} href={`/studies/${study.id}`} className="block">
                  <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base sm:text-xl font-bold">{study.title}</h3>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-xs sm:text-sm text-slate-500">{study.readTime}</span>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 mb-3">{study.context?.substring(0, 120)}...</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-slate-500">{study.verses.join(", ")}</span>
                      <span className="text-xs sm:text-sm text-primary font-medium flex items-center">
                        Start Reading
                        <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 ml-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-6 sm:py-8 bg-slate-50 rounded-xl border border-slate-100">
              <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">No saved studies yet</h3>
              <p className="text-sm sm:text-base text-slate-500 mb-3 sm:mb-4">Save your favorite studies to access them anytime</p>
              <Button asChild className="text-sm sm:text-base">
                <Link href="/studies">Browse Studies</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Recent Studies */}
        <section className="mb-6 sm:mb-8">
          <div className="flex items-center mb-3 sm:mb-4">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-slate-900" />
            <h2 className="text-xl sm:text-2xl font-bold">Recent Studies</h2>
          </div>

          {profileData?.recentStudiesData && profileData.recentStudiesData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-3 sm:space-y-4"
            >
              {profileData.recentStudiesData.map((study: any) => (
                <Link key={study.id} href={`/studies/${study.id}`} className="block">
                  <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-base sm:text-xl font-bold">{study.title}</h3>
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-xs sm:text-sm text-slate-500">{study.readTime}</span>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-slate-600 mb-3">{study.context?.substring(0, 120)}...</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-slate-500">{study.verses.join(", ")}</span>
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-slate-500">
                          {study.userLastReadTime ? formatDate(study.userLastReadTime) : "Recently"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-6 sm:py-8 bg-slate-50 rounded-xl border border-slate-100">
              <Clock className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
              <h3 className="text-lg sm:text-xl font-semibold mb-1 sm:mb-2">No recent studies</h3>
              <p className="text-sm sm:text-base text-slate-500 mb-3 sm:mb-4">Your recently viewed studies will appear here</p>
              <Button asChild className="text-sm sm:text-base">
                <Link href="/studies">Browse Studies</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Settings */}
        {isClient && (
          <section className="mb-6 sm:mb-8">
            <div className="flex items-center mb-3 sm:mb-4">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-slate-900" />
              <h2 className="text-xl sm:text-2xl font-bold">Settings</h2>
            </div>

            <div className="space-y-4">
              {/* Bible Translation */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-2">Bible Translation</h3>
                <Select value={contextPreferences.preferredTranslation} onValueChange={(value) => contextUpdatePreference("preferredTranslation", value)}>
                  <SelectTrigger>
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

              {/* Font Size */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-2">Font Size</h3>
                <Select value={contextPreferences.fontSize} onValueChange={(value) => contextUpdatePreference("fontSize", value as "small" | "medium" | "large")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                <h3 className="text-base sm:text-lg font-semibold mb-2">Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Daily Verse</p>
                      <p className="text-sm text-slate-500">Receive a new verse every day</p>
                    </div>
                    <Switch
                      checked={contextPreferences.notifications.dailyVerse}
                      onCheckedChange={() => contextUpdatePreference("notifications", {
                        ...contextPreferences.notifications,
                        dailyVerse: !contextPreferences.notifications.dailyVerse,
                      })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Study Reminders</p>
                      <p className="text-sm text-slate-500">Get reminded about your Bible study</p>
                    </div>
                    <Switch
                      checked={contextPreferences.notifications.studyReminders}
                      onCheckedChange={() => contextUpdatePreference("notifications", {
                        ...contextPreferences.notifications,
                        studyReminders: !contextPreferences.notifications.studyReminders,
                      })}
                    />
                  </div>
                </div>
              </div>

              {/* Dark Mode */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold">Dark Mode</h3>
                    <p className="text-sm text-slate-500">Use dark theme for better reading at night</p>
                  </div>
                  <Switch
                    checked={contextPreferences.darkMode}
                    onCheckedChange={(checked) => contextUpdatePreference("darkMode", checked)}
                  />
                </div>
              </div>

              {/* Save History */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold">Save History</h3>
                    <p className="text-sm text-slate-500">Keep track of your Bible study progress</p>
                  </div>
                  <Switch
                    checked={contextPreferences.saveHistory}
                    onCheckedChange={(checked) => contextUpdatePreference("saveHistory", checked)}
                  />
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}


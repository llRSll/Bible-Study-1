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
import { Bell, Book, Clock, Edit, Heart, Loader2, LogOut, Moon, Settings, Shield, Upload, User } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

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
  const [uploadingImage, setUploadingImage] = useState(false)
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

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formData = new FormData()
    formData.append("full_name", fullName)
    
    try {
      const result = await updateProfile(formData)
      if (result.error) {
        toast({
          title: "Error updating profile",
          description: result.error.message || "An error occurred",
          variant: "destructive",
        })
      } else {
        setProfileData({ ...profileData, full_name: fullName })
        setIsEditing(false)
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
    }
  }

  // Handle file selection for profile picture
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingImage(true)
    
    const formData = new FormData()
    formData.append("profile_picture", file)
    
    try {
      const result = await uploadProfilePicture(formData)
      if (result.error) {
        toast({
          title: "Error uploading image",
          description: result.error.message || "An error occurred",
          variant: "destructive",
        })
      } else {
        setProfileData({ ...profileData, profile_picture: result.data.profile_picture })
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully",
        })
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err)
      toast({
        title: "Error uploading image",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setUploadingImage(false)
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
      <header className="pt-12 pb-6 px-6 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-1">Profile</h1>
          <p className="text-slate-500 text-lg">Manage your account</p>
        </div>
        <Button 
          variant="outline" 
          className="flex items-center gap-2 text-slate-700"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Logging out...
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Log out
            </>
          )}
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-32">
        {/* User Card */}
        <section className="mb-8">
          <Card className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className={`h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden ${isEditing ? 'cursor-pointer' : ''}`} onClick={isEditing ? () => fileInputRef.current?.click() : undefined}>
                  {profileData?.profile_picture ? (
                    <Image 
                      src={profileData.profile_picture} 
                      alt="Profile" 
                      width={64} 
                      height={64} 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <User className="h-8 w-8 text-slate-400" />
                  )}
                  {isEditing && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                      <Edit className="h-6 w-6 text-white" />
                    </div>
                  )}
                </div>
                {!isEditing && (
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1"
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Upload className="h-3 w-3" />
                    )}
                  </button>
                )}

                {/* Hidden file input for profile picture upload */}
                <input 
                  name="profile_picture"
                
                  ref={fileInputRef}
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={uploadingImage}
                />
              </div>
              
              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="flex-1">
                  <div className="mb-4">
                    <Label htmlFor="full_name">Name</Label>
                    <Input 
                      id="full_name" 
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" type="button" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      Save
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold">{profileData?.full_name || "Anonymous User"}</h2>
                      <p className="text-slate-500">{profileData?.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Saved Studies */}
        <section className="mb-8">
          <div className="flex items-center mb-4">
            <Heart className="h-5 w-5 mr-2 text-slate-900" />
            <h2 className="text-2xl font-bold">Saved Studies</h2>
          </div>

          {profileData?.savedStudiesData && profileData.savedStudiesData.length > 0 ? (
            <div className="space-y-4">
              {profileData.savedStudiesData.map((study: any) => (
                <Link key={study.id} href={`/studies/${study.id}`} className="block">
                  <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                    <h3 className="font-bold text-xl mb-2">{study.title}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">{study.verses.join(", ")}</span>
                      <span className="text-slate-500 text-sm">{study.lastReadTime ? formatDate(study.lastReadTime) : "Not read yet"}</span>
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

          {profileData?.recentStudiesData && profileData.recentStudiesData.length > 0 ? (
            <div className="space-y-4">
              {profileData.recentStudiesData.map((study: any) => (
                <Link key={study.id} href={`/studies/${study.id}`} className="block">
                  <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                    <h3 className="font-bold text-xl mb-2">{study.title}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">{study.verses.join(", ")}</span>
                      <span className="text-slate-500 text-sm">{study.lastReadTime ? formatDate(study.lastReadTime) : "Recently"}</span>
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

            {/* Instead of the button, add a note about privacy */}
            <p className="text-center text-sm text-slate-500 mt-4">
              Your privacy and security are important to us.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}

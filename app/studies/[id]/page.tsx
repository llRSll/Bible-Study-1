"use client"

import { LikeButton } from "@/components/like-button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { VerseDisplay } from "@/components/verse-display"
import { getCurrentUser } from "@/lib/actions/auth"
import { addToRecentStudies, getUserProfile, saveStudy, unsaveStudy } from "@/lib/actions/profile"
import { getStudyById, type Study, toggleStudyPublicStatus } from "@/lib/actions/study"
import { Bookmark, ChevronLeft, ChevronRight, EyeIcon, EyeOffIcon, Loader2, MessageSquare, Share2, Copy } from "lucide-react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { use, useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true)
  const [study, setStudy] = useState<Study | null>(null)
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [translation, setTranslation] = useState("ESV")
  const [publishLoading, setPublishLoading] = useState(false)
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [isCurrentUserOwner, setIsCurrentUserOwner] = useState(false)


  // Check if the study is bookmarked
  useEffect(() => {
    const checkIfBookmarked = async () => {
      try {
        const { data: profileData, error: profileError } = await getUserProfile();
        
        if (profileError || !profileData) {
          return;
        }
        
        const saved = profileData.saved_studies?.includes(id) || false;
        setBookmarked(saved);
      } catch (err) {
        console.error("Error checking if study is bookmarked:", err);
      }
    };
    
    if (id) {
      checkIfBookmarked();
    }
  }, [id]);

  useEffect(() => {
    // Fetch the study data from Supabase
    const fetchStudy = async () => {
      setLoading(true)
      
      try {
        const result = await getStudyById(id);
        
        if (result.error) {
          console.error("Error fetching study:", result.error);
          setError("Failed to load study");
          setStudy(null);
        } else if (!result.data) {
          setError("Study not found");
          setStudy(null);
        } else {
          setStudy(result.data);
          setError(null);
          
          // Check if current user is the owner
          const { data } = await getCurrentUser();
          setIsCurrentUserOwner(data?.id === result.data.user_id);
          
          // Add to recent studies if not already done. If already done, update the last read time
           addToRecentStudies(id);
         
        }
      } catch (err) {
        console.error("Error fetching study:", err);
        setError("An unexpected error occurred");
        setStudy(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudy();
  }, [id]);

  const handleTranslationChange = (value: string) => {
    setTranslation(value)
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The verse has been copied to your clipboard.",
      duration: 2000,
    })
  }
  
  const handleBookmarkToggle = async () => {
    if (!study?.id) return;
    
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        // If already bookmarked, unsave it
        await unsaveStudy(study.id);
        setBookmarked(false);
        toast({
          title: "Removed from bookmarks",
          description: "Study has been removed from your bookmarks.",
          duration: 2000,
        });
      } else {
        // If not bookmarked, save it
        await saveStudy(study.id);
        setBookmarked(true);
        toast({
          title: "Bookmarked",
          description: "Study has been added to your bookmarks.",
          duration: 2000,
        });
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      toast({
        title: "Error",
        description: "Failed to update bookmark status. Please try again.",
        duration: 2000,
        variant: "destructive",
      });
    } finally {
      setBookmarkLoading(false);
    }
  };
  
  const handlePrivacyToggle = async () => {
    if (!study?.id) return;
    
    setPublishLoading(true);
    try {
      const { data, error } = await toggleStudyPublicStatus(study.id);
      
      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to update study privacy",
          variant: "destructive",
        });
        return;
      }
      
      // Update the local study state with the updated isPublic value
      setStudy({
        ...study,
        isPublic: data.isPublic,
      });
      
      toast({
        title: data.isPublic ? "Study Published" : "Study Unpublished",
        description: data.isPublic 
          ? "Your study is now public and can be viewed by others." 
          : "Your study is now private and only visible to you.",
        duration: 2000,
      });
    } catch (err) {
      console.error("Error toggling privacy:", err);
      toast({
        title: "Error",
        description: "Failed to update study privacy. Please try again.",
        duration: 2000,
        variant: "destructive",
      });
    } finally {
      setPublishLoading(false);
    }
  };


  const handleShare = () => {
    setShareDialogOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}${pathname}`;
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "The study link has been copied to your clipboard.",
        duration: 2000,
      });
      setShareDialogOpen(false);
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Failed to copy",
        description: "Could not copy the link. Please try again.",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  if (loading) {
    return (
        <div className="flex flex-col min-h-screen bg-white items-center justify-center">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm sm:text-base text-slate-500">loading study...</p>
        </div>
      )
  }

  if (error || !study) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="study-header px-4 sm:px-6 py-4 sm:py-6 border-b">
          <Link href="/studies" className="back-button">
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </Link>
          <h1 className="header-title text-lg sm:text-2xl font-bold">Error</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-red-500 mb-3 sm:mb-4">
            {error || "Study not found"}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 text-center">
            We couldn't load the study you requested. Please try again later.
          </p>
          <Link
            href="/studies"
            className="bg-primary text-white py-2 px-4 sm:px-6 rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base"
          >
            Return to Studies
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="study-header px-4 sm:px-6 py-4 sm:py-6 border-b">
        <Link href="/studies" className="back-button">
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </Link>
        <h1 className="header-title text-lg sm:text-2xl font-bold">{study.title}</h1>
      </div>

      <div className="study-content px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex justify-end mb-4">
          <Select value={translation} onValueChange={handleTranslationChange}>
            <SelectTrigger className="w-20 sm:w-24 text-sm sm:text-base">
              <SelectValue placeholder="Translation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ESV" className="text-sm sm:text-base">ESV</SelectItem>
              <SelectItem value="KJV" className="text-sm sm:text-base">KJV</SelectItem>
              <SelectItem value="NIV" className="text-sm sm:text-base">NIV</SelectItem>
              <SelectItem value="NASB" className="text-sm sm:text-base">NASB</SelectItem>
              <SelectItem value="NLT" className="text-sm sm:text-base">NLT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <h2 className="text-[3.2vw] sm:text-lg font-semibold mb-3 sm:mb-4 text-slate-900">Scripture</h2>

        <div className="space-y-4">
          {study.verses.map((verse, index) => (
            <VerseDisplay key={index} reference={verse} translation={translation} />
          ))}
        </div>

        <h2 className="text-[3.2vw] sm:text-lg font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4 text-slate-900">Study Insights</h2>

        <div className="space-y-4">
          {study.insights.map((insight, index) => (
            <div key={index} className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
              <h3 className="text-[3.2vw] sm:text-lg font-semibold mb-2 text-slate-900">{insight.title}</h3>
              <p className="text-[2.8vw] sm:text-base text-slate-700 leading-relaxed">{insight.description}</p>
            </div>
          ))}
        </div>

        {study.context && (
          <>
            <h2 className="text-[3.2vw] sm:text-lg font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4 text-slate-900">Context</h2>
            <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{study.context}</p>
            </div>
          </>
        )}

        {study.application && (
          <>
            <h2 className="text-[3.2vw] sm:text-lg font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4 text-slate-900">Application</h2>
            <div className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{study.application}</p>
            </div>
          </>
        )}

        {study.relatedQuestions && study.relatedQuestions.length > 0 && (
          <>
            <h2 className="text-[3.2vw] sm:text-lg font-semibold mt-6 sm:mt-8 mb-3 sm:mb-4 text-slate-900">Reflection Questions</h2>
            <div className="space-y-3">
              {study.relatedQuestions.map((question, index) => (
                <div key={index} className="flex items-start gap-3 bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm">
                  <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white font-semibold text-xs sm:text-sm">{index + 1}</span>
                  </div>
                  <p className="text-[2.8vw] sm:text-base text-slate-700 leading-relaxed">{question}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="w-[90vw] sm:max-w-md p-4 sm:p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-[3.2vw] sm:text-xl font-bold">Share Study</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
            <Input
              readOnly
              value={typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : ''}
              className="flex-1 text-[2.8vw] sm:text-base h-10 sm:h-11"
            />
            <Button 
              onClick={handleCopyLink} 
              className="flex items-center justify-center gap-2 text-[2.8vw] sm:text-base h-10 sm:h-11 px-4 sm:px-6"
            >
              <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="study-actions fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex justify-center items-center gap-4">
          <button
            className={`action-button ${bookmarked ? "active" : ""} p-2 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center`}
            onClick={handleBookmarkToggle}
            disabled={bookmarkLoading}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Bookmark className="h-5 w-5 sm:h-6 sm:w-6" fill={bookmarked ? "currentColor" : "none"} />
          </button>
          <div className="flex items-center justify-center">
            <LikeButton 
              studyId={study.id || ""} 
              initialLikes={study.likes || 0}
            />
          </div>
          <button 
            className="action-button p-2 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center" 
            aria-label="Share"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button 
            className="action-button p-2 rounded-full hover:bg-slate-100 transition-colors flex items-center justify-center" 
            aria-label="Comment"
            onClick={() => router.push('/ask')}
          >
            <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
      </div>
    </div>
  )
}

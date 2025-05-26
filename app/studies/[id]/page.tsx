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
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-slate-500">loading study...</p>
        </div>
      )
  }

  if (error || !study) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="study-header">
          <Link href="/studies" className="back-button">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="header-title">Error</h1>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 p-6">
          <h2 className="text-2xl font-bold text-red-500 mb-4">
            {error || "Study not found"}
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't load the study you requested. Please try again later.
          </p>
          <Link
            href="/studies"
            className="bg-primary text-white py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Return to Studies
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="study-header">
        <Link href="/studies" className="back-button">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="header-title">{study.title}</h1>
      </div>

      <div className="study-content">
        {/* <div className="flex justify-between items-center mb-4">
          {isCurrentUserOwner && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {study.isPublic ? "Public" : "Private"}
              </span>
              <Switch 
                checked={study.isPublic}
                onCheckedChange={handlePrivacyToggle}
                disabled={publishLoading}
                aria-label="Toggle study privacy"
              />
              {study.isPublic ? (
                <EyeIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeOffIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          )}
        </div> */}

        <div className="flex justify-end mb-4">
          <Select value={translation} onValueChange={handleTranslationChange}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Translation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ESV">ESV</SelectItem>
              <SelectItem value="KJV">KJV</SelectItem>
              <SelectItem value="NIV">NIV</SelectItem>
              <SelectItem value="NASB">NASB</SelectItem>
              <SelectItem value="NLT">NLT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <h2 className="section-title">Scripture</h2>

        <div className="scripture-cards">
          {study.verses.map((verse, index) => (
            <VerseDisplay key={index} reference={verse} translation={translation} />
          ))}
        </div>

        <h2 className="section-title">Study Insights</h2>

        <div className="insight-cards">
          {study.insights.map((insight, index) => (
            <div key={index} className="insight-card">
              <h3 className="insight-title">{insight.title}</h3>
              <p className="insight-content">{insight.description}</p>
            </div>
          ))}
        </div>

        {study.context && (
          <>
            <h2 className="section-title">Context</h2>
            <div className="insight-card">
              <p className="insight-content">{study.context}</p>
            </div>
          </>
        )}

        {study.application && (
          <>
            <h2 className="section-title">Application</h2>
            <div className="insight-card">
              <p className="insight-content">{study.application}</p>
            </div>
          </>
        )}

        {study.relatedQuestions && study.relatedQuestions.length > 0 && (
          <>
            <h2 className="section-title">Reflection Questions</h2>
            <div className="question-cards">
              {study.relatedQuestions.map((question, index) => (
                <div key={index} className="question-card">
                  <div className="question-number">{index + 1}</div>
                  <p className="question-text">{question}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Study</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <Input
              readOnly
              value={typeof window !== 'undefined' ? `${window.location.origin}${pathname}` : ''}
              className="flex-1"
            />
            <Button onClick={handleCopyLink} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="study-actions">
        <div className="action-buttons">
          <button
            className={`action-button ${bookmarked ? "active" : ""}`}
            onClick={handleBookmarkToggle}
            disabled={bookmarkLoading}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Bookmark className="action-icon" fill={bookmarked ? "currentColor" : "none"} />
          </button>
           <LikeButton 
           studyId={study.id || ""} 
           initialLikes={study.likes || 0}
         />
          <button 
            className="action-button" 
            aria-label="Share"
            onClick={handleShare}
          >
            <Share2 className="action-icon" />
          </button>
         
          
      
          <button 
            className="action-button" 
            aria-label="Comment"
            onClick={() => router.push('/ask')}
          >
            <MessageSquare className="action-icon" />
          </button>
        </div>
      </div>
    </div>
  )
}

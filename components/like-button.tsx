"use client";

import { useToast } from "@/components/ui/use-toast";
import { hasUserLikedStudy, likeStudy, unlikeStudy } from "@/lib/actions/study";
import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

interface LikeButtonProps {
  studyId: string;
  initialLikes?: number;
  initialLikedState?: boolean;
  onLikeChange?: (newLikeCount: number) => void;
}

export function LikeButton({
  studyId,
  initialLikes = 0,
  initialLikedState = false,
  onLikeChange,
}: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLikedState);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if the user has liked this study
  useEffect(() => {
    const checkLikedStatus = async () => {
      if (!studyId) return;
      
      try {
        const { liked } = await hasUserLikedStudy(studyId);
        setLiked(liked);
      } catch (error) {
        console.error("Error checking like status:", error);
      }
    };
    
    checkLikedStatus();
  }, [studyId]);

  const handleLikeToggle = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (liked) {
        // Unlike
        const { data, error } = await unlikeStudy(studyId);
        if (error) {
          toast({
            title: "Error",
            description: error.message || "Failed to unlike study",
            variant: "destructive",
          });
          return;
        }
        
        setLiked(false);
        const newLikeCount = data?.likes || likeCount - 1;
        setLikeCount(newLikeCount);
        if (onLikeChange) onLikeChange(newLikeCount);
        
      } else {
        // Like
        const { data, error } = await likeStudy(studyId);
        if (error) {
          toast({
            title: "Error",
            description: error.message || "Failed to like study",
            variant: "destructive",
          });
          return;
        }
        
        setLiked(true);
        const newLikeCount = data?.likes || likeCount + 1;
        setLikeCount(newLikeCount);
        if (onLikeChange) onLikeChange(newLikeCount);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`action-button ${liked ? "active" : ""}`}
      onClick={handleLikeToggle}
      disabled={isLoading}
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart className="action-icon" fill={liked ? "currentColor" : "none"} />
      {likeCount > 0 && <span className="text-xs ml-1">{likeCount}</span>}
    </button>
  );
} 
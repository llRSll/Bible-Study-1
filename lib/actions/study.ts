"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/utils/supabase/server";

export type Insight = {
  title: string;
  description: string;
};

export type Study = {
  id?: string;
  title: string;
  verses: string[];
  context?: string;
  insights: Insight[];
  application?: string;
  category?: string;
  readTime?: string;
  relatedQuestions?: string[];
  relatedTopics?: string[];
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  lastReadTime?: string;
  likes?: number;
  likedBy?: string[];
  isPublic?: boolean;
};

export async function createStudy(formData: FormData) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // Extract data from FormData - would need validation in production
  const study: Study = {
    title: formData.get("title") as string,
    verses: JSON.parse(formData.get("verses") as string),
    context: formData.get("context") as string,
    insights: JSON.parse(formData.get("insights") as string),
    application: formData.get("application") as string,
    category: formData.get("category") as string,
    readTime: formData.get("readTime") as string,
    relatedQuestions: JSON.parse(formData.get("relatedQuestions") as string),
    relatedTopics: formData.get("relatedTopics")
      ? JSON.parse(formData.get("relatedTopics") as string)
      : [],
    user_id: user.id,
    isPublic: true, // Default to public
    likes: 0, // Initialize with 0 likes
    likedBy: [], // Initialize with empty array
  };

  const { data, error } = await supabase
    .from("studies")
    .insert(study)
    .select()
    .single();

  if (error) {
    return { error };
  }

  revalidatePath("/studies");
  return { data };
}

export async function getUserStudies() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return { error };
  }

  return { data };
}

export async function getStudies() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return { error };
  }

  return { data };
}

export async function getStudyById(id: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // Get the study - Row Level Security will ensure we can only access
  // our own studies or public studies
  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .eq("id", id)
    .eq("isPublic", true)
    .single();

  if (error) {
    return { error };
  }

  return { data };
}

export async function updateStudy(id: string, formData: FormData) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // Extract data from FormData - would need validation in production
  const study: Partial<Study> = {
    title: formData.get("title") as string,
    verses: JSON.parse(formData.get("verses") as string),
    context: formData.get("context") as string,
    insights: JSON.parse(formData.get("insights") as string),
    application: formData.get("application") as string,
    category: formData.get("category") as string,
    readTime: formData.get("readTime") as string,
    relatedQuestions: JSON.parse(formData.get("relatedQuestions") as string),
    relatedTopics: formData.get("relatedTopics")
      ? JSON.parse(formData.get("relatedTopics") as string)
      : undefined,
  };

  const { data, error } = await supabase
    .from("studies")
    .update(study)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return { error };
  }

  revalidatePath(`/studies/${id}`);
  revalidatePath("/studies");
  return { data };
}

export async function deleteStudy(id: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  const { error } = await supabase
    .from("studies")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error };
  }

  revalidatePath("/studies");
  return { success: true };
}

export async function getStudiesByCategory(category: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .eq("user_id", user.id)
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    return { error };
  }

  return { data };
}

/**
 * Like a study
 * @param studyId The ID of the study to like
 */
export async function likeStudy(studyId: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // First get the study to check if the user already liked it
  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select('likes, "likedBy"')
    .eq("id", studyId)
    .single();

  if (studyError) {
    return { error: studyError };
  }

  // Check if user already liked this study
  const likedBy = study.likedBy || [];
  if (likedBy.includes(user.id)) {
    return { error: { message: "You have already liked this study" } };
  }

  // Update the study with incremented likes and add user to likedBy array
  const { data, error } = await supabase
    .from("studies")
    .update({
      likes: (study.likes || 0) + 1,
      likedBy: [...likedBy, user.id],
    })
    .eq("id", studyId)
    .select()
    .single();

  if (error) {
    return { error };
  }

  return { data };
}

export async function searchStudies(query: string, isTopic: boolean = false) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  const normalizedQuery = query.toLowerCase().trim();

  if (isTopic) {
    // For topic searches, only look in title
    const { data, error } = await supabase
      .from("studies")
      .select("*")
      .eq("user_id", user.id)
      .ilike("title", `%${normalizedQuery}%`)
      .order("created_at", { ascending: false });

    if (error) {
      return { error };
    }

    return { data };
  }

  // For regular searches (from search input), look in both title and verses
  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .eq("user_id", user.id)
    .or(`title.ilike.%${normalizedQuery}%,verses.cs.{${normalizedQuery}}`)
    .order("created_at", { ascending: false });

    if (error) {
      return { error };
    }

    return { data };
}
/**
 * Unlike a study
 * @param studyId The ID of the study to unlike
 */
export async function unlikeStudy(studyId: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // First get the study to check if the user already liked it
  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select('likes, "likedBy"')
    .eq("id", studyId)
    .single();

  if (studyError) {
    return { error: studyError };
  }

  // Check if user already liked this study
  const likedBy = study.likedBy || [];
  if (!likedBy.includes(user.id)) {
    return { error: { message: "You haven't liked this study yet" } };
  }

  // Update the study with decremented likes and remove user from likedBy array
  const { data, error } = await supabase
    .from("studies")
    .update({
      likes: Math.max(0, (study.likes || 0) - 1), // Ensure likes never go below 0
      likedBy: likedBy.filter((id: string) => id !== user.id),
    })
    .eq("id", studyId)
    .select()
    .single();
    
  if (error) {
    return { error };
  }

  return { data };
}

/**
 * Get featured studies - the top 5 studies with the most likes
 */
export async function getFeaturedStudies() {
  const supabase = await createClient();

  // make sure user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }
  // No need to check authentication as these are public studies

  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .eq("isPublic", true)
    .order("likes", { ascending: false })
    .limit(5);

  if (error) {
    return { error };
  }

  return { data };
}

/**
 * Check if the current user has liked a study
 * @param studyId The ID of the study to check
 */
export async function hasUserLikedStudy(studyId: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { liked: false };
  }

  // Get the study and check if the user ID is in the likedBy array
  const { data: study, error } = await supabase
    .from("studies")
    .select('"likedBy"')
    .eq("id", studyId)
    .single();

  if (error || !study) {
    return { liked: false };
  }

  return { liked: study.likedBy && study.likedBy.includes(user.id) };
}

/**
 * Toggle the public status of a study
 * @param studyId The ID of the study to toggle
 */
export async function toggleStudyPublicStatus(studyId: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // Get the current status
  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select('"isPublic"')
    .eq("id", studyId)
    .eq("user_id", user.id) // Ensure user owns the study
    .single();

  if (studyError) {
    return { error: studyError };
  }

  // Toggle the public status
  const { data, error } = await supabase
    .from("studies")
    .update({ isPublic: !study.isPublic })
    .eq("id", studyId)
    .eq("user_id", user.id) // Ensure user owns the study
    .select()
    .single();

  if (error) {
    return { error };
  }

  return { data };
}

/**
 * Update the related topics for a study
 * @param studyId The ID of the study to update
 * @param topics Array of topic strings
 */
export async function updateStudyTopics(studyId: string, topics: string[]) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // Normalize topics to prevent duplicates and empty values
  const normalizedTopics = [
    ...new Set(topics.filter(Boolean).map((t) => t.trim())),
  ];

  // Update the study with the new topics
  const { data, error } = await supabase
    .from("studies")
    .update({ relatedTopics: normalizedTopics })
    .eq("id", studyId)
    .eq("user_id", user.id) // Ensure user owns the study
    .select()
    .single();

  if (error) {
    return { error };
  }

  revalidatePath(`/studies/${studyId}`);
  return { data };
}

/**
 * Get studies by topic
 * @param topic The topic to search for
 * @param includePublic Whether to include public studies (default: true)
 */
export async function getStudiesByTopic(
  topic: string,
  includePublic: boolean = true
) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  try {
    // First try using the RPC function for better performance
    if (includePublic) {
      const { data: publicData, error: publicError } = await supabase.rpc(
        "search_studies_by_topic",
        { topic }
      );

      if (!publicError && publicData) {
        return { data: publicData };
      }
      // If RPC fails, we'll fall back to the direct query below
    }

    // Direct query - get user's own studies with this topic
    let query = supabase
      .from("studies")
      .select("*")
      .filter("relatedTopics", "cs", `{${topic}}`);

    // Only filter by user_id if we're not specifically including public studies
    // or we want both public and the user's own studies
    if (!includePublic) {
      query = query.eq("user_id", user.id);
    } else {
      query = query.or(`user_id.eq.${user.id},isPublic.eq.true`);
    }

    const { data, error } = await query
      .order("likes", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return { error };
    }

    return { data };
  } catch (error) {
    console.error("Error in getStudiesByTopic:", error);
    return { error: { message: "Failed to fetch studies by topic" } };
  }
}

/**
 * Get all available topics with their usage count
 * @param includePublic Whether to include topics from public studies (default: true)
 */
export async function getAllTopics(includePublic: boolean = true) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  try {
    // Get user's topics
    const { data: userTopics, error: userError } = await supabase.rpc(
      "get_user_topics",
      { user_id: user.id }
    );

    if (userError) {
      return { error: userError };
    }

    // If we don't need public topics, just return user topics
    if (!includePublic) {
      return { data: userTopics };
    }

    // Get public topics if requested
    const { data: publicTopics, error: publicError } = await supabase.rpc(
      "get_all_topics"
    );

    if (publicError) {
      return { error: publicError };
    }

    // Combine and deduplicate topics
    const topicMap = new Map<string, number>();

    // Add user topics first
    userTopics.forEach((item: { topic: string; count: number }) => {
      topicMap.set(item.topic, item.count);
    });

    // Add public topics, update count if the topic already exists
    publicTopics.forEach((item: { topic: string; count: number }) => {
      if (topicMap.has(item.topic)) {
        // Prioritize user's own studies by keeping the higher count
        topicMap.set(
          item.topic,
          Math.max(topicMap.get(item.topic)!, item.count)
        );
      } else {
        topicMap.set(item.topic, item.count);
      }
    });

    // Convert back to array format
    const combinedTopics = Array.from(topicMap.entries()).map(
      ([topic, count]) => ({
        topic,
        count,
      })
    );

    // Sort by count descending, then by topic name
    combinedTopics.sort(
      (a, b) => b.count - a.count || a.topic.localeCompare(b.topic)
    );

    return { data: combinedTopics };
  } catch (error) {
    console.error("Error in getAllTopics:", error);
    return { error: { message: "Failed to get topics" } };
  }
}

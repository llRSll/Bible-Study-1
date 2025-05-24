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
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  lastReadTime?: string;
  relatedTopics?: string[];
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
    user_id: user.id,
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
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

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

  const { data, error } = await supabase
    .from("studies")
    .select("*")
    .eq("id", id)
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
 * Update the lastReadTime of a study
 * @param studyId The ID of the study to update
 */
export async function updateLastReadTime(studyId: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // Update the lastReadTime to now
  const { data, error } = await supabase
    .from("studies")
    .update({ lastReadTime: new Date().toISOString() })
    .eq("id", studyId)
    .eq("user_id", user.id)
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

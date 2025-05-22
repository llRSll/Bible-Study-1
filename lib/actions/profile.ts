"use server";

import { createClient } from "@/utils/supabase/server";
import { Study } from "./study";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  profile_picture: string | null;
  saved_studies: string[]; // Array of IDs
  recent_studies: string[]; // Array of IDs
  created_at: string;
  updated_at: string;
  // Optional expanded objects
  savedStudiesData?: Study[];
  recentStudiesData?: Study[];
};

/**
 * Get the current user's profile with optional expanded study data
 */
export async function getUserProfile() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // First, get the profile data with arrays of study IDs
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return { error: profileError || { message: "Profile not found" } };
  }

  // Get saved studies data if there are any saved studies
  let savedStudiesData: Study[] = [];
  if (profile.saved_studies && profile.saved_studies.length > 0) {
    const { data: savedStudies, error: savedError } = await supabase
      .from("studies")
      .select("*")
      .in("id", profile.saved_studies);

    if (!savedError && savedStudies) {
      savedStudiesData = savedStudies;
    }
  }

  // Get recent studies data if there are any recent studies
  let recentStudiesData: Study[] = [];
  if (profile.recent_studies && profile.recent_studies.length > 0) {
    const { data: recentStudies, error: recentError } = await supabase
      .from("studies")
      .select("*")
      .in("id", profile.recent_studies);

    if (!recentError && recentStudies) {
      // Sort the recent studies to match the order in the profile.recent_studies array
      // Make sure to filter out any undefined values (in case a study was deleted)
      recentStudiesData = profile.recent_studies
        .map((id: string) => recentStudies.find((study) => study.id === id))
        .filter(
          (study: Study | undefined | null): study is Study =>
            study !== undefined && study !== null
        );
    }
  }

  // Combine everything into a single response
  return {
    data: {
      ...profile,
      savedStudiesData,
      recentStudiesData,
    } as Profile & { savedStudiesData: Study[]; recentStudiesData: Study[] },
  };
}

/**
 * Update the user's profile information
 */
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  try {
    // First, get the profile data with arrays of study IDs
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { error: profileError || { message: "Profile not found" } };
    }

    // Check if we have a new profile picture
    const file = formData.get("profile_picture") as File;
    let profilePictureUrl = profile.profile_picture;

    if (file && file.size > 0) {
      // Upload the file to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `profile.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Check if file exists and delete it first
      const { data: existingFiles } = await supabase.storage
        .from("profile-pictures")
        .list(user.id);

      if (existingFiles && existingFiles.length > 0) {
        await supabase.storage
          .from("profile-pictures")
          .remove(existingFiles.map((file) => `${user.id}/${file.name}`));
      }

      // Upload the new file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("Upload error during profile update:", uploadError);
        return { error: uploadError };
      }

      // Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);

      // Ensure the URL is valid
      profilePictureUrl = urlData.publicUrl;
      console.log("Generated public URL:", profilePictureUrl);
    }

    // Update the profile with name and profile picture
    const { data, error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.get("full_name"),
        profile_picture: profilePictureUrl,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return { error };
    }

    return { data };
  } catch (err) {
    console.error("Unexpected error during profile update:", err);
    return { error: { message: "An unexpected error occurred" } };
  }
}

/**
 * Save a study to the user's saved_studies list
 */
export async function saveStudy(studyId: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("saved_studies")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { error: profileError };
  }

  // Check if study is already saved
  const savedStudies = profile.saved_studies || [];
  if (!savedStudies.includes(studyId)) {
    // Add study to saved_studies array
    const { data, error } = await supabase
      .from("profiles")
      .update({ saved_studies: [...savedStudies, studyId] })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      return { error };
    }

    return { data };
  }
}

/**
 * Remove a study from the user's saved_studies list
 */
export async function unsaveStudy(studyId: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("saved_studies")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { error: profileError };
  }

  // Remove the study from saved_studies array
  const savedStudies = profile.saved_studies || [];
  const { data, error } = await supabase
    .from("profiles")
    .update({
      saved_studies: savedStudies.filter((id: string) => id !== studyId),
    })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return { error };
  }

  return { data };
}

/**
 * Add a study to the user's recent_studies list
 */
export async function addToRecentStudies(studyId: string) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // Get current profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("recent_studies")
    .eq("id", user.id)
    .single();

  if (profileError) {
    return { error: profileError };
  }

  // Remove the study if it's already in the list (to avoid duplicates)
  let recentStudies = profile.recent_studies || [];
  recentStudies = recentStudies.filter((id: string) => id !== studyId);

  // Add study to the beginning of recent_studies array (most recent first)
  // and limit to 10 studies
  const { data, error } = await supabase
    .from("profiles")
    .update({ recent_studies: [studyId, ...recentStudies].slice(0, 10) })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return { error };
  }

  return { data };
}

/**
 * Upload a profile picture to Supabase storage
 */
export async function uploadProfilePicture(formData: FormData) {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // Get the file from the form data
  const file = formData.get("profile_picture") as File;
  if (!file) {
    return { error: { message: "No file provided" } };
  }

  try {
    // Upload the file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `profile.${fileExt}`;
    const filePath = `${user.id}/${fileName}`;

    // Check if file exists and delete it first
    const { data: existingFiles } = await supabase.storage
      .from("profile-pictures")
      .list(user.id);

    if (existingFiles && existingFiles.length > 0) {
      await supabase.storage
        .from("profile-pictures")
        .remove(existingFiles.map((file) => `${user.id}/${file.name}`));
    }

    // Upload the new file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: uploadError };
    }

    // Get the public URL of the uploaded file
    const { data: urlData } = supabase.storage
      .from("profile-pictures")
      .getPublicUrl(filePath);

    // Ensure the URL is valid
    const profilePictureUrl = urlData.publicUrl;
    console.log("Generated public URL:", profilePictureUrl);

    // Update the user's profile with the new profile picture URL
    const { data, error } = await supabase
      .from("profiles")
      .update({ profile_picture: profilePictureUrl })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return { error };
    }

    return { data };
  } catch (err) {
    console.error("Unexpected error during profile picture upload:", err);
    return { error: { message: "An unexpected error occurred" } };
  }
}

// get two most recent read studies from the user's recent_studies list

export async function getRecentStudies() {
  const supabase = await createClient();

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: { message: "Not authenticated" } };
  }

  // Get the user's recent studies
  const { data: profile, error: recentError } = await supabase
    .from("profiles")
    .select("recent_studies")
    .eq("id", user.id)
    .single();

  if (recentError) {
    return { error: recentError };
  }

  // Based on the recent studeis ids and lastReadTime, get the two most recent studies

  const { data: studies, error: studiesError } = await supabase
    .from("studies")
    .select("*")
    .in("id", profile.recent_studies)
    .order("lastReadTime", { ascending: false })
    .limit(3);

  if (studiesError) {
    return { error: studiesError };
  }

  return { data: studies };
}

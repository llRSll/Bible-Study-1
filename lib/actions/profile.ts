"use server";

import { createClient } from "@/utils/supabase/server";
import { Study } from "./study";

export type RecentStudy = {
  studyId: string;
  lastReadTime: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  profile_picture: string | null;
  saved_studies: string[]; // Array of IDs
  recent_studies: RecentStudy[]; // JSONB array of objects with studyId and lastReadTime
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

  // Parse recent_studies as array (handling JSONB)
  const recentStudiesList: RecentStudy[] = Array.isArray(profile.recent_studies)
    ? profile.recent_studies
    : [];

  console.log("recentStudiesList", recentStudiesList)

  if (recentStudiesList.length > 0) {
    // Extract the study IDs from the recent studies array
    const recentStudyIds = recentStudiesList.map((study) => study.studyId);

    console.log("recentStudyIds", recentStudyIds)

    const { data: recentStudies, error: recentError } = await supabase
      .from("studies")
      .select("*")
      .in("id", recentStudyIds);

    console.log("recentStudies", recentStudies)

    if (!recentError && recentStudies) {
      // Sort the recent studies to match the order in the profile.recent_studies array
      // and enrich them with the user-specific lastReadTime
      recentStudiesData = recentStudiesList
        .map((recentItem) => {
          const study = recentStudies.find((s) => s.id === recentItem.studyId);
          if (study) {
            return {
              ...study,
              userLastReadTime: recentItem.lastReadTime,
            };
          }
          return null;
        })
        .filter(
          (study): study is Study & { userLastReadTime: string } =>
            study !== null
        );
    }

    console.log("recentStudiesData", recentStudiesData)
  }

  // console.log("savedStudiesData", savedStudiesData)
  // console.log("recentStudiesData", recentStudiesData)
  console.log("profile.recent_studies", profile.recent_studies)
  // Combine everything into a single response
  return {
    data: {
      ...profile,
      savedStudiesData,
      recentStudiesData,
    } as Profile & {
      savedStudiesData: Study[];
      recentStudiesData: (Study & { userLastReadTime: string })[];
    },
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

    // Prepare update data
    const updateData: {
      full_name?: string | null;
      profile_picture?: string | null;
      updated_at: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    // Handle name update
    const newName = formData.get("full_name");
    if (newName !== null) {
      updateData.full_name = newName as string;
    }

    // Handle profile picture update
    const file = formData.get("profile_picture") as File;
    if (file && file instanceof File && file.size > 0) {
      try {
        // Upload the file to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_profile.${fileExt}`; // Add timestamp to prevent caching
        const filePath = `${user.id}/${fileName}`;

        // Delete existing profile picture if any
        if (profile.profile_picture) {
          const oldFilePath = profile.profile_picture.split("/").pop();
          if (oldFilePath) {
            await supabase.storage
              .from("profile-pictures")
              .remove([`${user.id}/${oldFilePath}`]);
          }
        }

        // Upload the new file
        const { error: uploadError } = await supabase.storage
          .from("profile-pictures")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Get the public URL
        const { data: urlData } = supabase.storage
          .from("profile-pictures")
          .getPublicUrl(filePath);

        if (!urlData?.publicUrl) {
          throw new Error("Failed to get public URL for uploaded file");
        }

        updateData.profile_picture = urlData.publicUrl;
      } catch (uploadErr) {
        console.error("Error during file upload:", uploadErr);
        return { error: { message: "Failed to upload profile picture" } };
      }
    }

    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Get saved studies data
    let savedStudiesData: Study[] = [];
    if (updatedProfile.saved_studies?.length > 0) {
      const { data: savedStudies } = await supabase
        .from("studies")
        .select("*")
        .in("id", updatedProfile.saved_studies);

      if (savedStudies) {
        savedStudiesData = savedStudies;
      }
    }

    // Get recent studies data
    let recentStudiesData: Study[] = [];
    const recentStudiesList: RecentStudy[] = Array.isArray(updatedProfile.recent_studies)
      ? updatedProfile.recent_studies
      : [];

    if (recentStudiesList.length > 0) {
      const recentStudyIds = recentStudiesList.map((study) => study.studyId);
      const { data: recentStudies } = await supabase
        .from("studies")
        .select("*")
        .in("id", recentStudyIds);

      if (recentStudies) {
        recentStudiesData = recentStudiesList
          .map((recentItem) => {
            const study = recentStudies.find((s) => s.id === recentItem.studyId);
            if (study) {
              return {
                ...study,
                userLastReadTime: recentItem.lastReadTime,
              };
            }
            return null;
          })
          .filter((study): study is Study & { userLastReadTime: string } => study !== null);
      }
    }

    // Return complete profile data
    return {
      data: {
        ...updatedProfile,
        savedStudiesData,
        recentStudiesData,
      } as Profile & {
        savedStudiesData: Study[];
        recentStudiesData: (Study & { userLastReadTime: string })[];
      },
    };

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

  // Create the new recent study entry
  const newRecentStudy: RecentStudy = {
    studyId,
    lastReadTime: new Date().toISOString(),
  };

  // Parse recent studies as an array (Supabase returns JSONB as a string)
  let recentStudies: RecentStudy[] = Array.isArray(profile.recent_studies)
    ? profile.recent_studies
    : [];

  // Remove the study if it's already in the list (to avoid duplicates)
  recentStudies = recentStudies.filter((study) => study.studyId !== studyId);

  // Add study to the beginning of recent_studies array (most recent first)
  // and limit to 10 studies
  const { data, error } = await supabase
    .from("profiles")
    .update({
      recent_studies: [newRecentStudy, ...recentStudies].slice(0, 10),
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

// Get recent studies with their last read times
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

  // Parse recent studies as an array (Supabase returns JSONB as a string)
  const recentStudies: RecentStudy[] = Array.isArray(profile.recent_studies)
    ? profile.recent_studies
    : [];

  if (recentStudies.length === 0) {
    return { data: [] };
  }

  // Extract the study IDs
  const studyIds = recentStudies.map((study) => study.studyId);

  // Fetch the actual study data
  const { data: studies, error: studiesError } = await supabase
    .from("studies")
    .select("*")
    .in("id", studyIds)
    .limit(10);

  if (studiesError) {
    return { error: studiesError };
  }

  // Merge the study data with the last read times
  const enrichedStudies = studies.map((study) => {
    const recentStudy = recentStudies.find((rs) => rs.studyId === study.id);
    return {
      ...study,
      userLastReadTime: recentStudy ? recentStudy.lastReadTime : null,
    };
  });

  // Sort by most recently read
  enrichedStudies.sort((a, b) => {
    const timeA = a.userLastReadTime
      ? new Date(a.userLastReadTime).getTime()
      : 0;
    const timeB = b.userLastReadTime
      ? new Date(b.userLastReadTime).getTime()
      : 0;
    return timeB - timeA; // Descending order
  });

  return { data: enrichedStudies };
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = await createClient();
  const cookieStore = cookies();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Basic validation
  if (!data.email || !data.password) {
    return { success: false, error: "Email and password are required" };
  }

  // Check if user exists
  const { data: existingUser, error: searchError } = await supabase
    .from("profiles")
    .select("id, first_login")
    .eq("email", data.email)
    .maybeSingle();

  if (searchError) {
    console.error("Error logging in:", searchError);
  }

  if (!existingUser) {
    return {
      success: false,
      error: "No account found with this email. Please sign up first.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    if (error.message.includes("user") && error.message.includes("not found")) {
      return {
        success: false,
        error: "No account found with this email. Please sign up first.",
      };
    }

    if (error.message.includes("Invalid login credentials")) {
      return {
        success: false,
        error: "Invalid login credentials. Please try again.",
      };
    }

    return { success: false, error: error.message };
  }

  // Check if this is the user's first login
  if (existingUser.first_login === null || existingUser.first_login === true) {
    try {
      // Mark that this is no longer their first login
      await supabase
        .from("profiles")
        .update({ first_login: false })
        .eq("id", existingUser.id);

      // Return success with firstLogin flag
      return { 
        success: true, 
        firstLogin: true 
      };
    } catch (updateError) {
      console.error("Error updating first_login status:", updateError);
    }
  }

  return { success: true, firstLogin: false };
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  // Basic validation
  if (!data.email || !data.password) {
    return { success: false, error: "Email and password are required" };
  }

  if (data.password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters long",
    };
  }

  // Check if the user already exists
  const { data: existingUsers, error: searchError } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", data.email)
    .maybeSingle();

  if (searchError) {
    console.error("Error while signing up:", searchError);
  }

  if (existingUsers) {
    return {
      success: false,
      error: "An account with this email already exists. Please login.",
    };
  }

  // Now proceed with the actual signup
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/login`,
    },
  });

  if (error) {
    // Even if our checks didn't catch it, Supabase might still reject if user exists
    if (
      error.message.includes("already exists") ||
      error.message.includes("already registered")
    ) {
      return {
        success: false,
        error: "An account with this email already exists. Please login.",
      };
    }
    return { success: false, error: error.message };
  }

  // Revalidate paths to ensure data is fresh
  revalidatePath("/", "layout");

  // Return success instead of redirecting immediately
  return { success: true };
}

export async function logout() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {

    redirect("/auth/login");
  }

  const { error } = await supabase.auth.signOut();  

  if (error) {
    console.error("Error logging out:", error);
  }

  redirect("/auth/login");
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  return { success: true, data: user };
}

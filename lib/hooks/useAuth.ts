import { User } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import SupabaseService from "../services/supabaseService";
import { supabase } from "../supabaseClient";

// Create a global cache for the auth state to prevent multiple initializations
let globalUser: User | null = null;
let authInitialized = false;
let authListenerInitialized = false;

export function useAuth() {
  const [user, setUser] = useState<User | null>(globalUser);
  const [loading, setLoading] = useState(!authInitialized);
  const [error, setError] = useState<string | null>(null);
  const initialized = useRef(false);

  // Load user on initial render
  useEffect(() => {
    let mounted = true;

    // Prevent duplicate initialization
    if (initialized.current) {
      return () => {};
    }

    initialized.current = true;

    const getUser = async () => {
      try {
        if (!mounted) return;

        // Skip if auth is already initialized globally
        if (authInitialized && mounted) {
          setUser(globalUser);
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        console.log("useAuth: Getting session...");
        const { data: sessionData, error: sessionError } =
          await SupabaseService.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("useAuth: Session error:", sessionError);
          setError(sessionError);
          setLoading(false);
          return;
        }

        console.log("useAuth: Session result:", { hasSession: !!sessionData });

        // Only fetch user if we have a session
        if (sessionData) {
          console.log("useAuth: Getting current user...");
          const { data: userData, error: userError } =
            await SupabaseService.auth.getCurrentUser();

          if (!mounted) return;

          if (userError) {
            console.error("useAuth: User error:", userError);
            setError(userError);
            setLoading(false);
            return;
          }

          console.log("useAuth: User data:", userData);
          globalUser = userData;
          setUser(userData);
        } else {
          console.log("useAuth: No session, setting user to null");
          globalUser = null;
          setUser(null);
        }

        authInitialized = true;

        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        if (!mounted) return;

        console.error("useAuth: Unexpected error:", err);
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        console.error("Error in useAuth hook:", err);
        setLoading(false);
      }
    };

    getUser();

    // Only set up auth state listener once
    if (!authListenerInitialized) {
      // Subscribe to auth changes
      console.log("useAuth: Setting up auth state listener");
      authListenerInitialized = true;

      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log("useAuth: Auth state changed:", {
            event,
            hasSession: !!session,
          });

          // Update global state
          if (session?.user) {
            console.log(
              "useAuth: Auth state has user, updating user state",
              session.user
            );
            globalUser = session.user;
          } else {
            console.log(
              "useAuth: Auth state has no user, setting user to null"
            );
            globalUser = null;
          }

          // Update component state if still mounted
          if (mounted) {
            setUser(globalUser);
            setLoading(false);
          }
        }
      );

      // Cleanup subscription when app unmounts (rarely happens in practice)
      // We don't unsubscribe on component unmount to maintain global auth state
      window.addEventListener("beforeunload", () => {
        authListener.subscription.unsubscribe();
        authListenerInitialized = false;
      });
    }

    // Cleanup subscription and prevent updates after unmount
    return () => {
      console.log("useAuth: Component unmounted");
      mounted = false;
    };
  }, []);

  // Sign up
  const signup = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    console.log("useAuth: Signing up user:", { email });
    const result = await SupabaseService.auth.signUp(email, password);
    console.log("useAuth: Sign up result:", { success: result.success });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }

    return result;
  };

  // Sign in
  const signin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    console.log("useAuth: Signing in user:", { email });
    const result = await SupabaseService.auth.signInWithPassword(
      email,
      password
    );
    console.log("useAuth: Sign in result:", {
      success: result.success,
      hasUser: !!result.data?.user,
    });

    // On successful login, proactively update the user state
    if (result.success && result.data?.user) {
      globalUser = result.data.user;
      setUser(result.data.user);
    }

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }

    return result;
  };

  // Sign out
  const signout = async () => {
    setLoading(true);
    setError(null);

    console.log("useAuth: Signing out user");
    const result = await SupabaseService.auth.signOut();
    console.log("useAuth: Sign out result:", { success: result.success });

    // On successful logout, proactively clear the user state
    if (result.success) {
      globalUser = null;
      setUser(null);
    }

    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }

    return result;
  };

  const refreshUser = async () => {
    const result = await SupabaseService.auth.getCurrentUser();
    globalUser = result.data;
    setUser(result.data);
  };

  return {
    user,
    loading,
    error,
    signup,
    signin,
    signout,
    refreshUser,
    isAuthenticated: !!user,
  };
}

export default useAuth;

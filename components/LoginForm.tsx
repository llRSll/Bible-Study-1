"use client";

import { useAuth } from "@/lib/hooks/useAuth";
import SupabaseService from "@/lib/services/supabaseService";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";
  const isMounted = useRef(true);

  // Get auth context including the refreshUser function
  const { user, refreshUser } = useAuth();

  // Handle cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // State for redirect handling
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  // Handle successful login redirect
  useEffect(() => {
    if (shouldRedirect && success) {
      // Use full page navigation to ensure auth state is refreshed
      window.location.href = redirectPath;
    }
  }, [shouldRedirect, success, redirectPath]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { error, success } = await SupabaseService.auth.signInWithPassword(email, password);
      
      if (!isMounted.current) return;
      
      if (!success) {
        setError(error);
        setLoading(false);
      } else {
        // Update auth state
        await refreshUser();
        setSuccess(true);
        setLoading(false);
        setShouldRedirect(true);
      }
    } catch (err) {
      if (!isMounted.current) return;
      
      setLoading(false);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  }

  return (
    <div>
      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
      
      {success && (
        <div className="rounded-md bg-green-50 p-4 mb-4">
          <div className="text-sm text-green-700">Login successful! Redirecting...</div>
        </div>
      )}
      
      <form className="space-y-5" onSubmit={handleLogin}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading || success}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || success}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || success}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
} 
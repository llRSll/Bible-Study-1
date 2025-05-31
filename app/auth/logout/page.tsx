"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Logout() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setIsLoggingOut(true);
        const supabase = createClient();
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          setError(error.message);
          console.error("Error signing out:", error);
        } else {
          router.push("/");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setIsLoggingOut(false);
      }
    })();
  }, [router]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md text-center">
        {isLoggingOut ? (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Signing out...</h1>
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-6">
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error signing out</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
            <button 
              onClick={() => router.push("/")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Home
            </button>
          </div>
        ) : (
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Signed out successfully!</h1>
        )}
      </div>
    </div>
  );
} 
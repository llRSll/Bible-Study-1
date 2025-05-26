"use client";

import BottomNavigation from "@/components/bottom-navigation";
import { FeaturedStudies } from "@/components/featured-studies";
import { getDailyVerse, VerseResponse } from "@/lib/bible-api";
import { useUserPreferences } from "@/contexts/user-preferences";
import { BookOpen, Search, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// Helper to check if we need a new verse for the day
function needsNewVerse(timestamp: number): boolean {
  const now = new Date();
  const lastFetch = new Date(timestamp);
  return (
    lastFetch.getDate() !== now.getDate() ||
    lastFetch.getMonth() !== now.getMonth() ||
    lastFetch.getFullYear() !== now.getFullYear()
  );
}

export default function HomePage() {
  const { preferences } = useUserPreferences();
  const [dailyVerse, setDailyVerse] = useState<VerseResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDailyVerse() {
      try {
        // Check localStorage first
        const cached = localStorage.getItem('dailyVerse');
        if (cached) {
          const { verse, timestamp, translation } = JSON.parse(cached);
          
          // If we have a cached verse from today and the translation matches, use it
          if (!needsNewVerse(timestamp) && translation === preferences.preferredTranslation) {
            setDailyVerse(verse);
            setLoading(false);
            return;
          }
        }

        // If we need a new verse, fetch it
        const verse = await getDailyVerse(preferences.preferredTranslation);
        
        // Cache the new verse
        localStorage.setItem('dailyVerse', JSON.stringify({
          verse,
          timestamp: Date.now(),
          translation: preferences.preferredTranslation
        }));
        
        setDailyVerse(verse);
      } catch (error) {
        console.error("Error loading daily verse:", error);
        // Set a fallback verse
        const fallbackVerse = {
          reference: "Psalm 119:105",
          text: "Your word is a lamp to my feet and a light to my path.",
          translation: preferences.preferredTranslation || "ESV",
        };
        
        // Cache the fallback verse too
        localStorage.setItem('dailyVerse', JSON.stringify({
          verse: fallbackVerse,
          timestamp: Date.now(),
          translation: preferences.preferredTranslation
        }));
        
        setDailyVerse(fallbackVerse);
      } finally {
        setLoading(false);
      }
    }
  
    loadDailyVerse();
  }, [preferences.preferredTranslation]);

  // If authenticated, show the main app content
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="pt-12 pb-6 px-6">
        <h1 className="text-4xl font-extrabold tracking-tight mb-1">Bible Study</h1>
        <p className="text-slate-500 text-lg">Deepen your understanding</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-32">
        {/* Hero Section */}
        <section className="mb-10">
          <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full -ml-8 -mb-8"></div>

            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">Daily Verse</h2>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-white/80" />
                </div>
              ) : dailyVerse ? (
                <>
                  <p className="text-xl font-medium mb-3 leading-relaxed">"{dailyVerse.text}"</p>
                  <div className="flex justify-between items-center">
                    <span className="text-white/80">{dailyVerse.reference}</span>
                    <span className="text-white/60 text-sm">{dailyVerse.translation}</span>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-10">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/search" className="block">
              <div className="bg-slate-100 rounded-xl p-5 h-32 flex flex-col justify-between transition-all hover:bg-slate-200">
                <Search className="h-6 w-6 text-slate-900" />
                <div>
                  <h3 className="font-bold text-lg">Search</h3>
                  <p className="text-slate-500 text-sm">Find verses</p>
                </div>
              </div>
            </Link>

            <Link href="/studies/new" className="block">
              <div className="bg-slate-100 rounded-xl p-5 h-32 flex flex-col justify-between transition-all hover:bg-slate-200">
                <BookOpen className="h-6 w-6 text-slate-900" />
                <div>
                  <h3 className="font-bold text-lg">Studies</h3>
                  <p className="text-slate-500 text-sm">Explore topics</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Featured Studies */}
        <section className="mb-10">
          <FeaturedStudies />
        </section>

        {/* Topics Section */}
        <section>
          <div className="flex items-center mb-5">
            <TrendingUp className="h-5 w-5 mr-2 text-slate-900" />
            <h2 className="text-2xl font-bold">Topics</h2>
          </div>

          <div className="flex overflow-x-auto pb-4 gap-3 hide-scrollbar">
            {["Prayer", "Faith", "Hope", "Love", "Wisdom", "Grace", "Salvation"].map((topic) => (
              <Link
                key={topic}
                href={`/search?topic=${topic}`}
                className="px-5 py-3 bg-slate-100 rounded-full flex items-center whitespace-nowrap hover:bg-slate-200 transition-colors"
              >
                <span className="font-medium">{topic}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

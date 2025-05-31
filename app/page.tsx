"use client";

import BottomNavigation from "@/components/bottom-navigation";
import { FeaturedStudies } from "@/components/featured-studies";
import { getDailyVerse, VerseResponse } from "@/lib/bible-api";
import { useUserPreferences } from "@/contexts/user-preferences";
import { BookOpen, Search, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.1,
      when: "beforeChildren"
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100 }
  }
};

export default function HomePage() {
  const { preferences } = useUserPreferences();
  const [dailyVerse, setDailyVerse] = useState<VerseResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDailyVerse() {
      try {
        // Always try to fetch the latest verse from the server first
        let verse;
        try {
          verse = await getDailyVerse(preferences.preferredTranslation);
          
          // Cache the server-provided verse
          localStorage.setItem('dailyVerse', JSON.stringify({
            verse,
            timestamp: Date.now(),
            translation: preferences.preferredTranslation
          }));
        } catch (serverError) {
          console.error("Error fetching from server:", serverError);
          
          // If server fetch fails, check localStorage as fallback
          const cached = localStorage.getItem('dailyVerse');
          if (cached) {
            const { verse: cachedVerse, timestamp, translation } = JSON.parse(cached);
            
            // Only use cached verse if it's from today and translation matches
            if (!needsNewVerse(timestamp) && translation === preferences.preferredTranslation) {
              verse = cachedVerse;
            } else {
              throw new Error("Cached verse is outdated or translation doesn't match");
            }
          } else {
            throw new Error("No cached verse available");
          }
        }
        
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
    <motion.div 
      className="flex flex-col min-h-screen bg-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.header 
        className="pt-6 sm:pt-12 pb-4 sm:pb-6 px-4 sm:px-6"
        variants={itemVariants}
      >
        <motion.h1 
          className="text-[5vw] sm:text-4xl font-extrabold tracking-tight mb-1"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
        >
          Spiritual
        </motion.h1>
        <motion.p 
          className="text-slate-500 text-[3.5vw] sm:text-lg"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
        >
          Deepen your understanding
        </motion.p>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 pb-32">
        {/* Hero Section */}
        <motion.section 
          className="mb-6 sm:mb-10"
          variants={itemVariants}
        >
          <motion.div 
            className="bg-slate-900 text-white rounded-2xl p-4 sm:p-6 relative overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-primary/20 rounded-full -mr-8 sm:-mr-10 -mt-8 sm:-mt-10"></div>
            <div className="absolute bottom-0 left-0 w-16 sm:w-24 h-16 sm:h-24 bg-primary/10 rounded-full -ml-6 sm:-ml-8 -mb-6 sm:-mb-8"></div>

            <div className="relative z-10">
              <h2 className="text-[4.2vw] sm:text-2xl font-bold mb-2">Daily Verse</h2>
              {loading ? (
                <div className="space-y-3">
                  <div className="h-[3.8vw] sm:h-6 bg-slate-800/20 rounded animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%]" />
                  <div className="h-[3.8vw] sm:h-6 bg-slate-800/20 rounded animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%]" />
                  <div className="flex justify-between items-center">
                    <div className="h-[2.8vw] sm:h-4 w-24 bg-slate-800/20 rounded animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%]" />
                    <div className="h-[2.4vw] sm:h-3 w-12 bg-slate-800/20 rounded animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%]" />
                  </div>
                </div>
              ) : dailyVerse ? (
                <>
                  <motion.p 
                    className="text-[3.8vw] sm:text-xl font-medium mb-3 leading-relaxed"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    "{dailyVerse.text}"
                  </motion.p>
                  <motion.div 
                    className="flex justify-between items-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-white/80 text-[2.8vw] sm:text-base">{dailyVerse.reference}</span>
                    <span className="text-white/60 text-[2.4vw] sm:text-sm">{dailyVerse.translation}</span>
                  </motion.div>
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.section>

        {/* Quick Actions */}
        <motion.section 
          className="mb-6 sm:mb-10"
          variants={itemVariants}
        >
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/search" className="block">
                <div className="bg-slate-100 rounded-xl p-4 sm:p-5 h-28 sm:h-32 flex flex-col justify-between transition-all hover:bg-slate-200">
                  <Search className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900" />
                  <div>
                    <h3 className="font-bold text-[3.8vw] sm:text-lg">Search</h3>
                    <p className="text-slate-500 text-[2.8vw] sm:text-sm">Find verses</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href="/studies/new" className="block">
                <div className="bg-slate-100 rounded-xl p-4 sm:p-5 h-28 sm:h-32 flex flex-col justify-between transition-all hover:bg-slate-200">
                  <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-slate-900" />
                  <div>
                    <h3 className="font-bold text-[3.8vw] sm:text-lg">Studies</h3>
                    <p className="text-slate-500 text-[2.8vw] sm:text-sm">Explore topics</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>
        </motion.section>

        {/* Featured Studies */}
        <motion.section 
          className="mb-6 sm:mb-10"
          variants={itemVariants}
        >
          <FeaturedStudies />
        </motion.section>

        {/* Topics Section */}
        <motion.section variants={itemVariants}>
          <div className="flex items-center mb-4 sm:mb-5">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-slate-900" />
            <h2 className="text-[4.2vw] sm:text-2xl font-bold">Topics</h2>
          </div>

          <div className="flex overflow-x-auto pb-4 gap-2 sm:gap-3 hide-scrollbar">
            {["Prayer", "Faith", "Hope", "Love", "Wisdom", "Grace", "Salvation"].map((topic, index) => (
              <motion.div
                key={topic}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={`/search?topic=${topic}`}
                  className="px-4 sm:px-5 py-2 sm:py-3 bg-slate-100 rounded-full flex items-center whitespace-nowrap hover:bg-slate-200 transition-colors"
                >
                  <span className="font-medium text-[2.8vw] sm:text-sm">{topic}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </motion.div>
  );
}

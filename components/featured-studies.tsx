"use client";

import { getFeaturedStudies } from "@/lib/actions/study";
import { Flame, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function FeaturedStudies() {
  const [featuredStudies, setFeaturedStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedStudies = async () => {
      try {
        const { data, error } = await getFeaturedStudies();
        if (error) {
          console.error("Error fetching featured studies:", error);
          setFeaturedStudies([]);
        } else {
          setFeaturedStudies(data || []);
        }
      } catch (error) {
        console.error("Error fetching featured studies:", error);
        setFeaturedStudies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedStudies();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="flex items-center mb-4 sm:mb-5">
          <Flame className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
          <h2 className="text-[4.2vw] sm:text-2xl font-bold">Featured Studies</h2>
        </div>
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="bg-white border border-slate-100 rounded-xl p-4 sm:p-5 shadow-sm animate-pulse">
              <div className="h-5 w-1/3 bg-slate-200 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-slate-200 rounded mb-3"></div>
              <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (featuredStudies.length === 0) {
    return null; // Don't show the section if there are no featured studies
  }

  return (
    <div>
      <div className="flex items-center mb-4 sm:mb-5">
        <Flame className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
        <h2 className="text-[4.2vw] sm:text-2xl font-bold">Featured Studies</h2>
      </div>
      <div className="space-y-4">
        {featuredStudies.map((study) => (
          <Link key={study.id} href={`/studies/${study.id}`} className="block">
            <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-[3.2vw] sm:text-xl">{study.title}</h3>
                <div className="flex items-center text-slate-500">
                  <span className="text-[2.8vw] sm:text-sm mr-2">{study.readTime}</span>
                </div>
              </div>
              <p className="text-slate-600 mb-3 text-[2.8vw] sm:text-base">
                {study.context ? study.context.substring(0, 120) + "..." : ""}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[2.8vw] sm:text-sm">{study.verses.join(", ")}</span>
                <div className="flex justify-between items-center">
                  <span className="hidden sm:inline-flex items-center text-primary text-sm font-medium">
                    Start Reading
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 
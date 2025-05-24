"use client"

import { FeaturedStudies } from "@/components/featured-studies"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getStudiesByCategory, getUserStudies, type Study } from "@/lib/actions/study"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Plus, Search, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

export default function StudiesPage() {
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [studies, setStudies] = useState<Study[]>([])

  const categories = [
    "All",
    "Spiritual Growth",
    "Christian Living",
    "Theology",
    "Teachings of Jesus",
    "Spiritual Disciplines",
  ]

  // Fetch studies based on active category
  useEffect(() => {
    const fetchStudies = async () => {
      setLoading(true)
      
      try {
        let result;
        
        if (activeCategory === "all") {
          result = await getUserStudies();
        } else {
          result = await getStudiesByCategory(activeCategory);
        }
        
        if (result.error) {
          console.error("Error fetching studies:", result.error);
          setStudies([]);
        } else if (result.data) {
          setStudies(result.data);
        }
      } catch (error) {
        console.error("Error fetching studies:", error);
        setStudies([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudies();
  }, [activeCategory]);

  // Filter studies based on search query
  const filteredStudies = studies.filter((study) => {
    return (
      searchQuery === "" ||
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (study.context || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.verses.some(verse => verse.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="pt-12 pb-6 px-6">
        <h1 className="text-4xl font-extrabold tracking-tight mb-1">Bible Studies</h1>
        <p className="text-slate-500 text-lg">Explore in-depth studies</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-32">
        {/* Search Section */}
        <section className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search studies by title or verse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-100 border-slate-200"
            />
          </div>
        </section>

        {/* Categories */}
        <section className="mb-8">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-5 w-5 mr-2 text-slate-900" />
            <h2 className="text-2xl font-bold">Categories</h2>
          </div>
          <div className="flex overflow-x-auto pb-4 gap-3 hide-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category.toLowerCase())}
                className={`px-5 py-3 rounded-full flex items-center whitespace-nowrap transition-colors ${
                  activeCategory === category.toLowerCase()
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 hover:bg-slate-200"
                }`}
              >
                <span className="font-medium">{category}</span>
              </button>
            ))}
          </div>
        </section>


        {/* Studies List */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold">Studies</h2>
            <Button asChild variant="ghost" className="gap-1.5">
              <Link href="/studies/new">
                <Plus className="h-4 w-4" />
                <span>Create</span>
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((_, index) => (
                <div key={index} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm animate-pulse">
                  <div className="h-5 w-1/3 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 w-1/2 bg-slate-200 rounded mb-3"></div>
                  <div className="h-4 w-1/4 bg-slate-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredStudies.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {filteredStudies.map((study) => (
                <Link key={study.id} href={`/studies/${study.id}`} className="block">
                  <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-xl">{study.title}</h3>
                      <div className="flex items-center gap-2">
                        {/* {study.isPublic !== undefined && (
                          <span className="text-xs bg-slate-100 py-1 px-2 rounded-full">
                            {study.isPublic ? "Public" : "Private"}
                          </span>
                        )}
                        {study.likes && study.likes > 0 && (
                          <span className="text-xs bg-slate-100 py-1 px-2 rounded-full flex items-center">
                            ❤️ {study.likes}
                          </span>
                        )} */}
                        <span className="text-slate-500 text-sm">{study.readTime}</span>
                      </div>
                    </div>
                    <p className="text-slate-600 mb-3">{study.context?.substring(0, 120)}...</p>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 text-sm">{study.verses.join(", ")}</span>
                      <span className="text-primary text-sm font-medium flex items-center">
                        Start reading
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No studies found</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-6">
                {searchQuery ? 
                  "We couldn't find any studies matching your search criteria." :
                  "You haven't created any studies yet. Click the Create button to get started."}
              </p>
              {searchQuery && (
                <Button
                  onClick={() => {
                    setSearchQuery("")
                  }}
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

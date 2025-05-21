import Link from "next/link"
import { BookOpen, Search, ArrowRight, Clock, Bookmark, TrendingUp } from "lucide-react"
import BottomNavigation from "@/components/bottom-navigation"

export default function HomePage() {
  // Daily verse
  const dailyVerse = {
    reference: "Psalm 119:105",
    text: "Your word is a lamp to my feet and a light to my path.",
    translation: "ESV",
  }

  // Featured studies
  const featuredStudies = [
    {
      id: "forgiveness",
      title: "Forgiveness",
      description: "Understanding God's forgiveness and how to forgive others",
      readTime: "10 min",
    },
    {
      id: "beatitudes",
      title: "The Beatitudes",
      description: "Jesus' teachings on true blessedness",
      readTime: "15 min",
    },
    {
      id: "faith",
      title: "Faith",
      description: "Understanding what it means to live by faith",
      readTime: "12 min",
    },
  ]

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
              <p className="text-xl font-medium mb-3 leading-relaxed">"{dailyVerse.text}"</p>
              <div className="flex justify-between items-center">
                <span className="text-white/80">{dailyVerse.reference}</span>
                <span className="text-white/60 text-sm">{dailyVerse.translation}</span>
              </div>
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
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-2xl font-bold">Featured</h2>
            <Link href="/studies" className="text-primary flex items-center text-sm font-medium">
              View all <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          <div className="space-y-4">
            {featuredStudies.map((study) => (
              <Link key={study.id} href={`/studies/${study.id}`} className="block">
                <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl">{study.title}</h3>
                    <span className="text-slate-500 text-sm flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {study.readTime}
                    </span>
                  </div>
                  <p className="text-slate-600 mb-3">{study.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-primary text-sm font-medium">Start reading</span>
                    <Bookmark className="h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
                href={`/search?q=${topic}`}
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
  )
}

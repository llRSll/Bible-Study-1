import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import BottomNavigation from "@/components/bottom-navigation"
import { UserPreferencesProvider } from "@/contexts/user-preferences"

// Use Inter as the primary font
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Bible Study",
  description: "AI-powered Bible studies that remain true to Biblical teachings",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <UserPreferencesProvider>
            <div className="pb-14">{children}</div>
            <BottomNavigation />
          </UserPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

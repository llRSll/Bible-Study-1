import { ThemeProvider } from "@/components/theme-provider"
import { UserPreferencesProvider } from "@/contexts/user-preferences"
import { OnboardingProvider } from "@/contexts/onboarding-context"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import "./globals.css"
import ClientBottomNav from "@/components/ClientBottomNav"
import AppOnboarding from "@/components/app-onboarding"
import { Toaster } from "@/components/ui/toaster"

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
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-white font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <OnboardingProvider>
            <UserPreferencesProvider>
              <Toaster />
              <div className="pb-14">{children}</div>
              <ClientBottomNav />
              <AppOnboarding />
            </UserPreferencesProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

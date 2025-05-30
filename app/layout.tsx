import { ThemeProvider } from "@/components/theme-provider"
import { UserPreferencesProvider } from "@/contexts/user-preferences"
import { OnboardingProvider } from "@/contexts/onboarding-context"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import "./globals.css"
import AppOnboarding from "@/components/app-onboarding"
import { Toaster } from "@/components/ui/toaster"
import AppShell from "@/components/AppShell"

// Use Inter as the primary font
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: "Spiritual",
  description: "AI-powered Bible studies that deepen your understanding of scripture",
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
              <AppShell>{children}</AppShell>
              <AppOnboarding />
            </UserPreferencesProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

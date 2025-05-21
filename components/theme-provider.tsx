'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ 
  children, 
  defaultTheme = 'light',
  ...props 
}: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false)
  
  // This ensures hydration doesn't mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])
  
  // Force the theme during server rendering and initial client render
  // This ensures the HTML structure matches between server and client
  const forcedTheme = !mounted ? defaultTheme : undefined
  
  return (
    <NextThemesProvider forcedTheme={forcedTheme} {...props}>
      {children}
    </NextThemesProvider>
  )
}

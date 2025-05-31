"use client";

import { usePathname } from "next/navigation";
import BottomNavigation from "@/components/bottom-navigation";

export default function ClientBottomNav() {
  const pathname = usePathname();
  const authPaths = ['/login', '/signup', '/auth']; // Add any auth-related paths here
  
  // Don't show navigation on auth pages
  if (authPaths.some(path => pathname?.startsWith(path))) {
    return null;
  }
  
  return <BottomNavigation />;
}
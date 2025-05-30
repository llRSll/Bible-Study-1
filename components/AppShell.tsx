"use client";
import { useState, useEffect } from "react";
import SplashScreen from "@/components/splash-screen";
import ClientBottomNav from "@/components/ClientBottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [splashVisible, setSplashVisible] = useState(true);

  // Ensure the app is initialized
  useEffect(() => {
    // Fallback safety mechanism - force hide splash after 6 seconds
    const fallbackTimer = setTimeout(() => {
      setSplashVisible(false);
    }, 6000);

    return () => clearTimeout(fallbackTimer);
  }, []);

  // Handle splash screen finish
  const handleSplashFinish = () => {
    setSplashVisible(false);
  };

  return (
    <>
      {/* Always render the splash screen on first load */}
      <SplashScreen isVisible={splashVisible} onFinish={handleSplashFinish} />
      
      {/* Only show content when splash is not visible */}
      <div className={`pb-14 ${splashVisible ? 'hidden' : 'block'}`}>{children}</div>
      
      {/* Only show navigation when splash is not visible */}
      {!splashVisible && <ClientBottomNav />}
    </>
  );
} 
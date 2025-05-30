"use client";

import { useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function SplashScreen({ isVisible, onFinish }: { isVisible: boolean, onFinish: () => void }) {
  useEffect(() => {
    if (!isVisible) return;
    
    // Normal timeout to hide splash screen after 2.5 seconds
    const normalTimer = setTimeout(() => {
      onFinish();
    }, 2500);
    
    // Failsafe timeout - force hide after 5 seconds maximum
    const failsafeTimer = setTimeout(() => {
      console.log("Splash screen failsafe triggered");
      onFinish();
    }, 5000);
    
    return () => {
      clearTimeout(normalTimer);
      clearTimeout(failsafeTimer);
    };
  }, [isVisible, onFinish]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-[#172B44] flex flex-col items-center justify-center z-[9999]"
          style={{ height: '100vh', width: '100vw' }}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative w-24 h-24 mb-8"
          >
            <Image 
              src="/Icon.png" 
              alt="Spiritual Logo"
              fill
              priority
              sizes="96px"
              className="object-contain rounded-xl"
            />
          </motion.div>
          
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col items-center"
          >
            <h1 className="text-white text-4xl font-bold mb-2">Spiritual</h1>
            <p className="text-white/80 text-sm">Deepen your understanding</p>
          </motion.div>
          
          <motion.div 
            className="absolute bottom-12 flex space-x-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <motion.div 
              className="w-2 h-2 bg-white/60 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.2 }}
            />
            <motion.div 
              className="w-2 h-2 bg-white/60 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.2, delay: 0.2 }}
            />
            <motion.div 
              className="w-2 h-2 bg-white/60 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.2, delay: 0.4 }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
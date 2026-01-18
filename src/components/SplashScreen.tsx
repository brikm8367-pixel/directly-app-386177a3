import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Start animation after a brief moment
    const showTimer = setTimeout(() => setShowLogo(true), 100);
    
    // Play satisfying pop sound when animation completes
    const soundTimer = setTimeout(() => {
      playPopSound();
    }, 1200);
    
    // Complete splash after animation
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 400);
    }, 2000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(soundTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const playPopSound = () => {
    // Create a satisfying, gentle "pop" sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Main pop tone
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      
      oscillator.type = 'sine';
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
      
      // Secondary harmonic for richness
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.setValueAtTime(1200, audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.08);
      
      gain2.gain.setValueAtTime(0.08, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      osc2.type = 'sine';
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported, continue silently
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, filter: 'blur(20px)' }}
            animate={showLogo ? { 
              scale: 1, 
              opacity: 1, 
              filter: 'blur(0px)',
            } : {}}
            transition={{ 
              duration: 0.8,
              ease: [0.34, 1.56, 0.64, 1], // Spring-like bounce
            }}
            className="relative"
          >
            {/* Golden Crown in Speech Bubble SVG */}
            <svg 
              width="180" 
              height="180" 
              viewBox="0 0 100 100" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-2xl"
            >
              {/* Glow effect */}
              <defs>
                <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#D4AF37" />
                  <stop offset="50%" stopColor="#FFD700" />
                  <stop offset="100%" stopColor="#B8860B" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Speech Bubble */}
              <path 
                d="M15 20 Q15 10 25 10 L75 10 Q85 10 85 20 L85 55 Q85 65 75 65 L35 65 L25 80 L30 65 L25 65 Q15 65 15 55 Z" 
                fill="none"
                stroke="url(#goldGradient)"
                strokeWidth="4"
                filter="url(#glow)"
              />
              
              {/* Crown */}
              <path 
                d="M30 50 L35 30 L45 40 L50 25 L55 40 L65 30 L70 50 Z" 
                fill="url(#goldGradient)"
                filter="url(#glow)"
              />
              
              {/* Crown jewels */}
              <circle cx="35" cy="28" r="3" fill="url(#goldGradient)" />
              <circle cx="50" cy="23" r="3" fill="url(#goldGradient)" />
              <circle cx="65" cy="28" r="3" fill="url(#goldGradient)" />
            </svg>
            
            {/* Pulse ring effect */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={showLogo ? { scale: 1.5, opacity: [0, 0.3, 0] } : {}}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border-2 border-primary"
              style={{ transformOrigin: 'center' }}
            />
          </motion.div>
          
          {/* Brand name - appears after logo */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={showLogo ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="absolute bottom-24 text-2xl font-bold gold-shine tracking-wide"
          >
            Directly
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { motion } from "framer-motion";
import { useEffect } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)" }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Subtle ambient glow */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
        style={{
          background: 'radial-gradient(circle at 50% 50%, hsl(var(--neon-cyan) / 0.05) 0%, transparent 50%)',
        }}
      />

      <div className="relative flex flex-col items-center">
        {/* Main Title - Cinematic Blur Reveal */}
        <motion.h1
          initial={{ 
            letterSpacing: "0.8em", 
            opacity: 0, 
            filter: "blur(30px)",
            scale: 1.2
          }}
          animate={{ 
            letterSpacing: "0.15em", 
            opacity: 1, 
            filter: "blur(0px)",
            scale: 1
          }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-7xl font-black tracking-widest text-foreground"
          style={{
            textShadow: '0 0 60px hsl(var(--foreground) / 0.3)',
          }}
        >
          AXON
        </motion.h1>

        {/* Slogan - Extreme Letter Spacing Fade */}
        <motion.p
          initial={{ opacity: 0, y: 10, letterSpacing: "0.8em" }}
          animate={{ opacity: 0.4, y: 0, letterSpacing: "0.35em" }}
          transition={{ delay: 1.2, duration: 1.2, ease: "easeOut" }}
          className="mt-6 text-[9px] uppercase text-muted-foreground font-medium"
        >
          Train Your Neural Pathways
        </motion.p>

        {/* Minimal line accent */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 0.3 }}
          transition={{ delay: 1.5, duration: 0.8 }}
          className="mt-8 w-16 h-px bg-foreground"
        />
      </div>
    </motion.div>
  );
};
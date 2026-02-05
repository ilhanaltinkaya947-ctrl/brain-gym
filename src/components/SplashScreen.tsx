 import { motion } from "framer-motion";
 import { Zap } from "lucide-react";
 import { useEffect } from "react";
 
 interface SplashScreenProps {
   onComplete: () => void;
 }
 
 export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
   useEffect(() => {
     const timer = setTimeout(onComplete, 2500);
     return () => clearTimeout(timer);
   }, [onComplete]);
 
   return (
     <motion.div
       className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
       initial={{ opacity: 1 }}
       exit={{ opacity: 0, filter: "blur(10px)" }}
       transition={{ duration: 0.8, ease: "easeInOut" }}
     >
       <div className="relative flex flex-col items-center">
         {/* Animated Icon */}
         <motion.div
           initial={{ scale: 0, rotate: -180, opacity: 0 }}
           animate={{ scale: 1, rotate: 0, opacity: 1 }}
           transition={{ duration: 1.2, type: "spring" }}
           className="mb-6 relative"
         >
           <div className="absolute inset-0 bg-bio-orange/40 blur-xl rounded-full animate-pulse" />
           <Zap className="w-12 h-12 text-foreground fill-foreground relative z-10" />
         </motion.div>
 
         {/* Main Title - Cinematic Blur Reveal */}
         <motion.h1
           initial={{ letterSpacing: "1em", opacity: 0, filter: "blur(20px)" }}
           animate={{ letterSpacing: "0.2em", opacity: 1, filter: "blur(0px)" }}
           transition={{ duration: 1.5, ease: "easeOut" }}
           className="text-6xl font-black tracking-widest text-gradient-speed"
         >
           AXON
         </motion.h1>
 
         {/* Slogan - Slow Fade In */}
         <motion.p
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 0.5, y: 0 }}
           transition={{ delay: 1.0, duration: 1 }}
           className="mt-4 text-[10px] font-mono uppercase tracking-[0.4em] text-muted-foreground"
         >
           Train Your Neural Pathways
         </motion.p>
       </div>
     </motion.div>
   );
 };
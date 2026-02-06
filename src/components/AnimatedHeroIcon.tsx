import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

// --- ICON DEFINITIONS (as SVG components with Framer Motion) ---

// Icon 1: Neuron (simple version)
const NeuronIcon = () => (
  <motion.svg
    width="100" height="100" viewBox="0 0 100 100" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
  >
    <motion.circle
      cx="50" cy="50" r="15" fill="currentColor"
      animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    <motion.path
      d="M50 50 L70 30 M50 50 L30 30 M50 50 L70 70 M50 50 L30 70"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
    />
    {/* Dendrite dots */}
    <motion.circle cx="70" cy="30" r="4" fill="currentColor" opacity="0.6"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
    />
    <motion.circle cx="30" cy="30" r="4" fill="currentColor" opacity="0.6"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
    />
    <motion.circle cx="70" cy="70" r="4" fill="currentColor" opacity="0.6"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
    />
    <motion.circle cx="30" cy="70" r="4" fill="currentColor" opacity="0.6"
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 1.4 }}
    />
  </motion.svg>
);

// Icon 2: Atom (with orbiting electrons)
const AtomIcon = () => (
  <motion.svg
    width="100" height="100" viewBox="0 0 100 100" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
  >
    {/* Nucleus */}
    <motion.circle 
      cx="50" cy="50" r="10" fill="currentColor"
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Orbit rings */}
    <motion.ellipse
      cx="50" cy="50" rx="35" ry="15" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"
      animate={{ rotate: 360 }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "50px 50px" }}
    />
    <motion.ellipse
      cx="50" cy="50" rx="35" ry="15" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"
      animate={{ rotate: -360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "50px 50px", transform: "rotate(60deg)" }}
    />
    <motion.ellipse
      cx="50" cy="50" rx="35" ry="15" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4"
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "50px 50px", transform: "rotate(120deg)" }}
    />
    {/* Electrons */}
    <motion.circle
      cx="85" cy="50" r="4" fill="currentColor"
      animate={{ rotate: 360 }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "50px 50px" }}
    />
  </motion.svg>
);

// Icon 3: DNA Strand (double helix)
const DNAIcon = () => (
  <motion.svg
    width="100" height="100" viewBox="0 0 100 100" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
  >
    {/* Left strand */}
    <motion.path
      d="M35 10 Q55 25 35 40 Q15 55 35 70 Q55 85 35 100"
      stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Right strand */}
    <motion.path
      d="M65 10 Q45 25 65 40 Q85 55 65 70 Q45 85 65 100"
      stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"
      animate={{ y: [0, 10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Base pair connections */}
    <motion.line x1="35" y1="25" x2="65" y2="25" stroke="currentColor" strokeWidth="1.5" opacity="0.5"
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
    />
    <motion.line x1="35" y1="55" x2="65" y2="55" stroke="currentColor" strokeWidth="1.5" opacity="0.5"
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
    />
    <motion.line x1="35" y1="85" x2="65" y2="85" stroke="currentColor" strokeWidth="1.5" opacity="0.5"
      animate={{ opacity: [0.3, 0.7, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, delay: 1 }}
    />
  </motion.svg>
);

// Icon 4: Brain Waves (EEG-style)
const BrainWavesIcon = () => (
  <motion.svg
    width="100" height="100" viewBox="0 0 100 100" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
  >
    {/* Wave 1 - Alpha */}
    <motion.path
      d="M5 35 Q15 20 25 35 Q35 50 45 35 Q55 20 65 35 Q75 50 85 35 Q95 20 100 35"
      stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Wave 2 - Beta */}
    <motion.path
      d="M5 50 Q12 40 20 50 Q28 60 36 50 Q44 40 52 50 Q60 60 68 50 Q76 40 84 50 Q92 60 100 50"
      stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.7 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
    />
    {/* Wave 3 - Theta */}
    <motion.path
      d="M5 65 Q20 55 35 65 Q50 75 65 65 Q80 55 95 65"
      stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 0.5 }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
    />
  </motion.svg>
);

// Icon 5: Neural Network Node
const NeuralNodeIcon = () => (
  <motion.svg
    width="100" height="100" viewBox="0 0 100 100" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
  >
    {/* Central node */}
    <motion.circle
      cx="50" cy="50" r="12" fill="currentColor"
      animate={{ scale: [1, 1.15, 1], opacity: [0.9, 1, 0.9] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
    {/* Connecting lines */}
    <motion.line x1="50" y1="38" x2="50" y2="15" stroke="currentColor" strokeWidth="1.5" opacity="0.6"
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
    />
    <motion.line x1="50" y1="62" x2="50" y2="85" stroke="currentColor" strokeWidth="1.5" opacity="0.6"
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
    />
    <motion.line x1="38" y1="50" x2="15" y2="50" stroke="currentColor" strokeWidth="1.5" opacity="0.6"
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
    />
    <motion.line x1="62" y1="50" x2="85" y2="50" stroke="currentColor" strokeWidth="1.5" opacity="0.6"
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
    />
    {/* Outer nodes */}
    <motion.circle cx="50" cy="15" r="5" fill="currentColor" opacity="0.5"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
    />
    <motion.circle cx="50" cy="85" r="5" fill="currentColor" opacity="0.5"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
    />
    <motion.circle cx="15" cy="50" r="5" fill="currentColor" opacity="0.5"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
    />
    <motion.circle cx="85" cy="50" r="5" fill="currentColor" opacity="0.5"
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ duration: 2, repeat: Infinity, delay: 0.9 }}
    />
    {/* Diagonal connections */}
    <motion.line x1="42" y1="42" x2="22" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <motion.line x1="58" y1="42" x2="78" y2="22" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <motion.line x1="42" y1="58" x2="22" y2="78" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    <motion.line x1="58" y1="58" x2="78" y2="78" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    {/* Corner nodes */}
    <motion.circle cx="22" cy="22" r="3" fill="currentColor" opacity="0.3" />
    <motion.circle cx="78" cy="22" r="3" fill="currentColor" opacity="0.3" />
    <motion.circle cx="22" cy="78" r="3" fill="currentColor" opacity="0.3" />
    <motion.circle cx="78" cy="78" r="3" fill="currentColor" opacity="0.3" />
  </motion.svg>
);

// Icon 6: Cogwheel / Logic Gears
const GearsIcon = () => (
  <motion.svg
    width="100" height="100" viewBox="0 0 100 100" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
  >
    {/* Main gear */}
    <motion.g
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "55px 55px" }}
    >
      <circle cx="55" cy="55" r="20" stroke="currentColor" strokeWidth="3" fill="none" />
      <circle cx="55" cy="55" r="6" fill="currentColor" />
      {/* Gear teeth */}
      <rect x="52" y="30" width="6" height="8" fill="currentColor" />
      <rect x="52" y="72" width="6" height="8" fill="currentColor" />
      <rect x="30" y="52" width="8" height="6" fill="currentColor" />
      <rect x="72" y="52" width="8" height="6" fill="currentColor" />
    </motion.g>
    {/* Secondary gear */}
    <motion.g
      animate={{ rotate: -360 }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      style={{ transformOrigin: "30px 30px" }}
    >
      <circle cx="30" cy="30" r="12" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7" />
      <circle cx="30" cy="30" r="4" fill="currentColor" opacity="0.7" />
      {/* Gear teeth */}
      <rect x="28" y="14" width="4" height="5" fill="currentColor" opacity="0.7" />
      <rect x="28" y="41" width="4" height="5" fill="currentColor" opacity="0.7" />
      <rect x="14" y="28" width="5" height="4" fill="currentColor" opacity="0.7" />
      <rect x="41" y="28" width="5" height="4" fill="currentColor" opacity="0.7" />
    </motion.g>
  </motion.svg>
);

// Icon 7: Growth / Synapse Tree
const GrowthIcon = () => (
  <motion.svg
    width="100" height="100" viewBox="0 0 100 100" fill="none"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }}
  >
    {/* Main trunk */}
    <motion.path
      d="M50 90 L50 60"
      stroke="currentColor" strokeWidth="3" strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 1, ease: "easeOut" }}
    />
    {/* Branch left */}
    <motion.path
      d="M50 60 L30 40"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
    />
    {/* Branch right */}
    <motion.path
      d="M50 60 L70 35"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
    />
    {/* Sub-branch left */}
    <motion.path
      d="M30 40 L20 25"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 1, ease: "easeOut" }}
    />
    <motion.path
      d="M30 40 L40 25"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 1.1, ease: "easeOut" }}
    />
    {/* Sub-branch right */}
    <motion.path
      d="M70 35 L60 20"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 1.2, ease: "easeOut" }}
    />
    <motion.path
      d="M70 35 L80 20"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.6, delay: 1.3, ease: "easeOut" }}
    />
    {/* Synapse nodes */}
    <motion.circle cx="20" cy="25" r="4" fill="currentColor"
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
      transition={{ duration: 0.5, delay: 1.4 }}
    />
    <motion.circle cx="40" cy="25" r="4" fill="currentColor"
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
      transition={{ duration: 0.5, delay: 1.5 }}
    />
    <motion.circle cx="60" cy="20" r="4" fill="currentColor"
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
      transition={{ duration: 0.5, delay: 1.6 }}
    />
    <motion.circle cx="80" cy="20" r="4" fill="currentColor"
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0.8] }}
      transition={{ duration: 0.5, delay: 1.7 }}
    />
    {/* Pulsing glow on nodes */}
    <motion.circle cx="20" cy="25" r="4" fill="currentColor"
      animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.3, 0.8] }}
      transition={{ duration: 2, repeat: Infinity, delay: 2 }}
    />
    <motion.circle cx="80" cy="20" r="4" fill="currentColor"
      animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0.3, 0.8] }}
      transition={{ duration: 2, repeat: Infinity, delay: 2.3 }}
    />
  </motion.svg>
);

// Array of all icon components
const icons = [
  NeuronIcon,
  AtomIcon,
  DNAIcon,
  BrainWavesIcon,
  NeuralNodeIcon,
  GearsIcon,
  GrowthIcon,
];

// Main AnimatedHeroIcon component
const AnimatedHeroIcon: React.FC = () => {
  // Use useMemo to pick a random icon only on mount
  const IconComponent = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * icons.length);
    return icons[randomIndex];
  }, []);

  return (
    <motion.div 
      className="text-neon-cyan w-24 h-24 flex items-center justify-center"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: 'spring', stiffness: 200 }}
    >
      <IconComponent />
    </motion.div>
  );
};

export default AnimatedHeroIcon;

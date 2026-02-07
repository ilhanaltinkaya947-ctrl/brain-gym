import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface NeuralBrainProps {
  size?: number;
  brainCharge?: number;
}

// Dendrite branch paths - tree-like structure
const dendritePaths = [
  // Left main branch
  { d: "M50 42 Q42 35 32 25", width: 2.5 },
  { d: "M32 25 Q25 18 18 12", width: 1.8 },
  { d: "M32 25 Q28 20 22 18", width: 1.4 },
  { d: "M28 30 Q22 25 15 22", width: 1.2 },
  { d: "M18 12 Q14 8 10 5", width: 1 },
  { d: "M18 12 Q22 7 25 3", width: 1 },
  
  // Center-left branch
  { d: "M48 40 Q44 28 40 18", width: 2.2 },
  { d: "M40 18 Q36 10 32 5", width: 1.5 },
  { d: "M40 18 Q44 12 46 6", width: 1.3 },
  { d: "M42 25 Q38 20 34 16", width: 1.1 },
  
  // Center branch
  { d: "M50 38 L50 22", width: 2.5 },
  { d: "M50 22 Q47 14 44 8", width: 1.6 },
  { d: "M50 22 Q53 14 56 8", width: 1.6 },
  { d: "M50 22 L50 10", width: 1.4 },
  { d: "M50 10 Q48 5 46 2", width: 1 },
  { d: "M50 10 Q52 5 54 2", width: 1 },
  
  // Center-right branch
  { d: "M52 40 Q56 28 60 18", width: 2.2 },
  { d: "M60 18 Q64 10 68 5", width: 1.5 },
  { d: "M60 18 Q56 12 54 6", width: 1.3 },
  { d: "M58 25 Q62 20 66 16", width: 1.1 },
  
  // Right main branch
  { d: "M50 42 Q58 35 68 25", width: 2.5 },
  { d: "M68 25 Q75 18 82 12", width: 1.8 },
  { d: "M68 25 Q72 20 78 18", width: 1.4 },
  { d: "M72 30 Q78 25 85 22", width: 1.2 },
  { d: "M82 12 Q86 8 90 5", width: 1 },
  { d: "M82 12 Q78 7 75 3", width: 1 },
  
  // Side branches
  { d: "M44 48 Q32 46 20 44", width: 1.8 },
  { d: "M20 44 Q12 42 5 40", width: 1.2 },
  { d: "M56 48 Q68 46 80 44", width: 1.8 },
  { d: "M80 44 Q88 42 95 40", width: 1.2 },
];

// Axon terminal paths
const axonTerminals = [
  { d: "M42 88 Q36 92 28 95", width: 1.4 },
  { d: "M28 95 Q24 97 20 98", width: 1 },
  { d: "M42 88 Q38 94 35 98", width: 1.2 },
  { d: "M42 88 Q42 93 41 97", width: 1.2 },
  { d: "M42 88 Q46 92 50 95", width: 1.4 },
  { d: "M50 95 Q54 97 58 98", width: 1 },
  { d: "M42 88 Q48 93 54 96", width: 1.2 },
];

// Myelin sheath segments
const myelinSegments = [
  { cx: 49, cy: 62, rx: 4, ry: 5 },
  { cx: 47, cy: 72, rx: 4, ry: 5 },
  { cx: 44, cy: 81, rx: 3.5, ry: 4.5 },
];

// Mobile: Simplified static with CSS pulse
function MobileBrain({ size = 200 }: { size: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 45%, hsl(300, 70%, 50%, 0.2) 0%, transparent 45%)`,
        }}
        animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.03, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="somaMobileGrad" cx="40%" cy="40%">
            <stop offset="0%" stopColor="hsl(320, 90%, 85%)" />
            <stop offset="40%" stopColor="hsl(300, 80%, 70%)" />
            <stop offset="80%" stopColor="hsl(280, 70%, 55%)" />
            <stop offset="100%" stopColor="hsl(270, 60%, 45%)" stopOpacity="0.6" />
          </radialGradient>
          <linearGradient id="dendriteMobileGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="hsl(190, 90%, 65%)" />
            <stop offset="100%" stopColor="hsl(180, 85%, 55%)" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="myelinMobileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(320, 50%, 80%)" />
            <stop offset="100%" stopColor="hsl(300, 40%, 70%)" />
          </linearGradient>
        </defs>

        {/* Dendrites - static */}
        <g stroke="url(#dendriteMobileGrad)" strokeLinecap="round" fill="none" opacity="0.7">
          {dendritePaths.slice(0, 15).map((path, i) => (
            <path key={i} d={path.d} strokeWidth={path.width * 0.9} />
          ))}
        </g>

        {/* Axon trunk */}
        <path
          d="M50 55 Q50 60 49 65 Q48 72 46 78 Q44 84 42 88"
          stroke="hsl(190, 80%, 60%)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />

        {/* Myelin segments */}
        {myelinSegments.map((seg, i) => (
          <ellipse
            key={i}
            cx={seg.cx}
            cy={seg.cy}
            rx={seg.rx}
            ry={seg.ry}
            fill="url(#myelinMobileGrad)"
            opacity="0.8"
          />
        ))}

        {/* Axon terminals */}
        <g stroke="hsl(190, 85%, 60%)" strokeLinecap="round" fill="none" opacity="0.6">
          {axonTerminals.map((path, i) => (
            <path key={i} d={path.d} strokeWidth={path.width} />
          ))}
        </g>

        {/* Soma - irregular star shape */}
        <motion.path
          d="M50 42 Q54 44 56 42 Q58 46 56 48 Q58 52 56 54 Q54 56 50 54 Q46 56 44 54 Q42 52 44 48 Q42 46 44 42 Q46 44 50 42"
          fill="url(#somaMobileGrad)"
          animate={{ scale: [1, 1.06, 1] }}
          style={{ transformOrigin: '50px 48px' }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Soma highlight */}
        <circle cx="47" cy="46" r="3" fill="hsl(320, 100%, 90%)" fillOpacity="0.4" />

        {/* Terminal bulbs */}
        {[
          { cx: 20, cy: 98, delay: 0 },
          { cx: 35, cy: 98, delay: 0.2 },
          { cx: 41, cy: 97, delay: 0.4 },
          { cx: 58, cy: 98, delay: 0.6 },
        ].map((dot, i) => (
          <motion.circle
            key={i}
            cx={dot.cx}
            cy={dot.cy}
            r="2"
            fill="hsl(180, 100%, 75%)"
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: dot.delay }}
          />
        ))}
      </svg>

      {/* Soma glow overlay */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-4%' }}>
        <motion.div
          className="rounded-full"
          style={{ width: size * 0.13, height: size * 0.13 }}
          animate={{
            boxShadow: [
              `0 0 ${size * 0.05}px hsl(300, 80%, 65%, 0.5)`,
              `0 0 ${size * 0.09}px hsl(300, 80%, 65%, 0.7)`,
              `0 0 ${size * 0.05}px hsl(300, 80%, 65%, 0.5)`,
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

// Desktop: Full animation with signal pulses
function DesktopBrain({ size = 200, brainCharge = 0 }: NeuralBrainProps) {
  const glowIntensity = Math.max(0.6, brainCharge / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Ambient magenta glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 45%, hsl(300, 70%, 50%, ${glowIntensity * 0.25}) 0%, transparent 50%)`,
        }}
        animate={{ opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <defs>
          {/* Soma glow filter - magenta */}
          <filter id="somaGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="1.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Dendrite glow - cyan */}
          <filter id="dendriteGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Signal pulse glow */}
          <filter id="signalGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soma gradient - magenta/pink */}
          <radialGradient id="somaGrad" cx="40%" cy="40%">
            <stop offset="0%" stopColor="hsl(320, 90%, 85%)" />
            <stop offset="35%" stopColor="hsl(300, 80%, 70%)" />
            <stop offset="70%" stopColor="hsl(280, 70%, 55%)" />
            <stop offset="100%" stopColor="hsl(270, 60%, 45%)" stopOpacity="0.7" />
          </radialGradient>

          {/* Dendrite gradient - cyan/teal */}
          <linearGradient id="dendriteGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="hsl(190, 90%, 65%)" />
            <stop offset="50%" stopColor="hsl(185, 85%, 60%)" />
            <stop offset="100%" stopColor="hsl(180, 80%, 50%)" stopOpacity="0.6" />
          </linearGradient>

          {/* Myelin sheath gradient - pale pink */}
          <linearGradient id="myelinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(320, 50%, 82%)" />
            <stop offset="50%" stopColor="hsl(310, 45%, 75%)" />
            <stop offset="100%" stopColor="hsl(300, 40%, 68%)" />
          </linearGradient>

          {/* Axon gradient */}
          <linearGradient id="axonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(190, 85%, 65%)" />
            <stop offset="100%" stopColor="hsl(185, 80%, 55%)" />
          </linearGradient>
        </defs>

        {/* === DENDRITES (Top Branches) === */}
        <g stroke="url(#dendriteGrad)" strokeLinecap="round" fill="none" filter="url(#dendriteGlow)">
          {dendritePaths.map((path, i) => (
            <path 
              key={i} 
              d={path.d} 
              strokeWidth={path.width} 
              opacity={0.75 - (i * 0.01)}
            />
          ))}
        </g>

        {/* === AXON TRUNK === */}
        <path
          d="M50 55 Q50 60 49 65 Q48 72 46 78 Q44 84 42 88"
          stroke="url(#axonGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
          filter="url(#dendriteGlow)"
        />

        {/* === MYELIN SHEATH SEGMENTS === */}
        <g filter="url(#dendriteGlow)">
          {myelinSegments.map((seg, i) => (
            <motion.ellipse
              key={i}
              cx={seg.cx}
              cy={seg.cy}
              rx={seg.rx}
              ry={seg.ry}
              fill="url(#myelinGrad)"
              opacity={0.85}
              animate={{ opacity: [0.75, 0.95, 0.75] }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                delay: i * 0.4,
                ease: 'easeInOut'
              }}
            />
          ))}
        </g>

        {/* === AXON TERMINALS (Bottom Branches) === */}
        <g stroke="url(#axonGrad)" strokeLinecap="round" fill="none" filter="url(#dendriteGlow)">
          {axonTerminals.map((path, i) => (
            <path key={i} d={path.d} strokeWidth={path.width} opacity="0.7" />
          ))}
        </g>

        {/* === SOMA (Cell Body) - Irregular Star Shape === */}
        <motion.path
          d="M50 40 Q55 43 58 40 Q60 45 58 50 Q61 54 58 58 Q54 60 50 58 Q46 60 42 58 Q39 54 42 50 Q40 45 42 40 Q45 43 50 40"
          fill="url(#somaGrad)"
          filter="url(#somaGlow)"
          animate={{ 
            scale: [1, 1.08, 1],
            opacity: [0.9, 1, 0.9]
          }}
          style={{ transformOrigin: '50px 49px' }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Soma inner highlights */}
        <circle cx="46" cy="46" r="4" fill="hsl(320, 100%, 90%)" fillOpacity="0.35" />
        <circle cx="45" cy="45" r="2" fill="hsl(320, 100%, 95%)" fillOpacity="0.5" />

        {/* === DENDRITE SIGNAL PULSES (toward soma) === */}
        {[
          { path: "M18 12 Q25 18 32 25 Q42 35 50 42", delay: 0 },
          { path: "M82 12 Q75 18 68 25 Q58 35 50 42", delay: 1.5 },
          { path: "M32 5 Q36 10 40 18 Q44 28 48 40", delay: 3 },
          { path: "M68 5 Q64 10 60 18 Q56 28 52 40", delay: 4.5 },
          { path: "M5 40 Q12 42 20 44 Q32 46 44 48", delay: 2 },
          { path: "M95 40 Q88 42 80 44 Q68 46 56 48", delay: 3.5 },
        ].map((signal, i) => (
          <motion.circle
            key={`dendrite-signal-${i}`}
            r="2.5"
            fill="hsl(180, 100%, 75%)"
            filter="url(#signalGlow)"
            animate={{ 
              opacity: [0, 1, 1, 0], 
              offsetDistance: ['0%', '100%'] 
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              repeatDelay: 5,
              delay: signal.delay, 
              ease: 'easeIn' 
            }}
            style={{ offsetPath: `path('${signal.path}')` }}
          />
        ))}

        {/* === AXON SIGNAL PULSE (away from soma) === */}
        <motion.circle
          r="3"
          fill="hsl(180, 100%, 75%)"
          filter="url(#signalGlow)"
          animate={{ 
            opacity: [0, 1, 1, 0], 
            offsetDistance: ['0%', '100%'] 
          }}
          transition={{ 
            duration: 1.2, 
            repeat: Infinity, 
            repeatDelay: 2.5,
            delay: 2, 
            ease: 'easeOut' 
          }}
          style={{ offsetPath: "path('M50 55 Q50 60 49 65 Q48 72 46 78 Q44 84 42 88')" }}
        />

        {/* === TERMINAL BULBS === */}
        {[
          { cx: 10, cy: 5, r: 2.2, delay: 0 },
          { cx: 25, cy: 3, r: 2, delay: 0.3 },
          { cx: 46, cy: 2, r: 2, delay: 0.1 },
          { cx: 54, cy: 2, r: 2, delay: 0.2 },
          { cx: 75, cy: 3, r: 2, delay: 0.4 },
          { cx: 90, cy: 5, r: 2.2, delay: 0.5 },
        ].map((dot, i) => (
          <motion.circle
            key={`dendrite-tip-${i}`}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill="hsl(190, 90%, 65%)"
            filter="url(#dendriteGlow)"
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: dot.delay }}
          />
        ))}

        {/* Axon terminal bulbs */}
        {[
          { cx: 20, cy: 98, delay: 0 },
          { cx: 35, cy: 98, delay: 0.2 },
          { cx: 41, cy: 97, delay: 0.3 },
          { cx: 54, cy: 96, delay: 0.4 },
          { cx: 58, cy: 98, delay: 0.5 },
        ].map((dot, i) => (
          <motion.circle
            key={`axon-tip-${i}`}
            cx={dot.cx}
            cy={dot.cy}
            r="2.5"
            fill="hsl(180, 100%, 75%)"
            filter="url(#signalGlow)"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: dot.delay }}
          />
        ))}
      </svg>

      {/* Soma glow overlay */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-2%' }}>
        <motion.div
          className="rounded-full"
          style={{ width: size * 0.18, height: size * 0.18 }}
          animate={{
            boxShadow: [
              `0 0 ${size * 0.06}px hsl(300, 80%, 65%, 0.4), 0 0 ${size * 0.12}px hsl(280, 70%, 55%, 0.2)`,
              `0 0 ${size * 0.1}px hsl(300, 80%, 65%, 0.65), 0 0 ${size * 0.18}px hsl(280, 70%, 55%, 0.35)`,
              `0 0 ${size * 0.06}px hsl(300, 80%, 65%, 0.4), 0 0 ${size * 0.12}px hsl(280, 70%, 55%, 0.2)`,
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

export function NeuralBrain({ size = 200, brainCharge = 0 }: NeuralBrainProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileBrain size={size} />;
  }
  return <DesktopBrain size={size} brainCharge={brainCharge} />;
}

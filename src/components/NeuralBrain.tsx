import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMemo } from 'react';

interface NeuralBrainProps {
  size?: number;
  brainCharge?: number;
}

// Dendrite branch definitions for reuse
const dendriteBranches = [
  // Left major fan
  { d: "M50 44 Q35 35 18 22", width: 2.5 },
  { d: "M18 22 Q10 15 4 8", width: 1.6 },
  { d: "M18 22 Q12 18 6 16", width: 1.3 },
  { d: "M28 32 Q18 26 8 22", width: 1.4 },
  
  // Center-left
  { d: "M48 42 Q40 30 35 15", width: 2.2 },
  { d: "M35 15 Q30 8 24 3", width: 1.4 },
  { d: "M35 15 Q38 8 40 3", width: 1.2 },
  
  // Center
  { d: "M50 42 Q50 28 50 14", width: 2.4 },
  { d: "M50 14 Q44 6 38 2", width: 1.3 },
  { d: "M50 14 Q56 6 62 2", width: 1.3 },
  { d: "M50 14 L50 4", width: 1.4 },
  
  // Center-right
  { d: "M52 42 Q60 30 65 15", width: 2.2 },
  { d: "M65 15 Q70 8 76 3", width: 1.4 },
  { d: "M65 15 Q62 8 60 3", width: 1.2 },
  
  // Right major fan
  { d: "M50 44 Q65 35 82 22", width: 2.5 },
  { d: "M82 22 Q90 15 96 8", width: 1.6 },
  { d: "M82 22 Q88 18 94 16", width: 1.3 },
  { d: "M72 32 Q82 26 92 22", width: 1.4 },
  
  // Side horizontal
  { d: "M44 48 Q28 46 10 44", width: 1.8 },
  { d: "M56 48 Q72 46 90 44", width: 1.8 },
];

// Dendrite tip positions
const dendriteTips = [
  { cx: 4, cy: 8 }, { cx: 6, cy: 16 }, { cx: 8, cy: 22 },
  { cx: 24, cy: 3 }, { cx: 40, cy: 3 }, { cx: 38, cy: 2 },
  { cx: 50, cy: 4 }, { cx: 62, cy: 2 }, { cx: 60, cy: 3 },
  { cx: 76, cy: 3 }, { cx: 96, cy: 8 }, { cx: 94, cy: 16 },
  { cx: 92, cy: 22 }, { cx: 10, cy: 44 }, { cx: 90, cy: 44 },
];

// Axon terminal branches
const axonTerminals = [
  { d: "M42 92 Q30 95 18 97", width: 1.5 },
  { d: "M18 97 Q10 98 4 98", width: 1.1 },
  { d: "M42 92 Q38 96 34 98", width: 1.3 },
  { d: "M42 92 Q42 96 42 99", width: 1.3 },
  { d: "M42 92 Q48 95 56 97", width: 1.5 },
  { d: "M56 97 Q66 98 76 98", width: 1.1 },
  { d: "M42 92 Q52 95 62 98", width: 1.3 },
];

// Terminal tip positions
const terminalTips = [
  { cx: 4, cy: 98 }, { cx: 34, cy: 98 }, { cx: 42, cy: 99 },
  { cx: 62, cy: 98 }, { cx: 76, cy: 98 },
];

// Signal path definitions
const signalPaths = [
  // Dendrite → Soma (incoming signals)
  { path: "M4 8 Q10 15 18 22 Q35 35 50 44", type: 'in' },
  { path: "M96 8 Q90 15 82 22 Q65 35 50 44", type: 'in' },
  { path: "M24 3 Q30 8 35 15 Q40 30 48 42", type: 'in' },
  { path: "M76 3 Q70 8 65 15 Q60 30 52 42", type: 'in' },
  { path: "M50 4 L50 14 Q50 28 50 42", type: 'in' },
  { path: "M10 44 Q28 46 44 48", type: 'in' },
  { path: "M90 44 Q72 46 56 48", type: 'in' },
  // Soma → Axon (outgoing signals)
  { path: "M50 54 Q48 65 46 76 Q44 84 42 92", type: 'out' },
];

// Mobile: Optimized CSS-only with elegant static design
function MobileBrain({ size = 200, brainCharge = 0 }: { size: number; brainCharge: number }) {
  const glowIntensity = 0.5 + (brainCharge / 100) * 0.5;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: '30%',
          top: '35%',
          width: '40%',
          height: '30%',
          background: `radial-gradient(circle, 
            hsla(300, 90%, 65%, ${glowIntensity * 0.5}) 0%, 
            hsla(280, 80%, 50%, ${glowIntensity * 0.2}) 40%, 
            transparent 70%)`,
        }}
        animate={{
          opacity: [0.7, 1, 0.7],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="somaMobileGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="hsl(320, 100%, 92%)" />
            <stop offset="40%" stopColor="hsl(300, 90%, 70%)" />
            <stop offset="100%" stopColor="hsl(280, 80%, 50%)" />
          </radialGradient>
          
          <linearGradient id="cyanMobileGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="hsl(180, 100%, 65%)" />
            <stop offset="100%" stopColor="hsl(175, 90%, 50%)" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Dendrites */}
        <g stroke="url(#cyanMobileGrad)" strokeLinecap="round" fill="none" opacity="0.8">
          {dendriteBranches.map((branch, i) => (
            <path key={i} d={branch.d} strokeWidth={branch.width} />
          ))}
        </g>

        {/* Dendrite tips */}
        <g fill="hsl(180, 100%, 70%)" opacity="0.85">
          {dendriteTips.map((tip, i) => (
            <circle key={i} cx={tip.cx} cy={tip.cy} r="1.8" />
          ))}
        </g>

        {/* Axon - single clean line, no ugly segments */}
        <path
          d="M50 54 Q48 65 46 76 Q44 84 42 92"
          stroke="hsl(180, 100%, 60%)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />

        {/* Axon terminals */}
        <g stroke="hsl(180, 95%, 60%)" strokeLinecap="round" fill="none" opacity="0.75">
          {axonTerminals.map((term, i) => (
            <path key={i} d={term.d} strokeWidth={term.width} />
          ))}
        </g>

        {/* Terminal tips */}
        <g fill="hsl(180, 100%, 75%)" opacity="0.85">
          {terminalTips.map((tip, i) => (
            <circle key={i} cx={tip.cx} cy={tip.cy} r="2" />
          ))}
        </g>

        {/* Soma - clean glowing orb */}
        <circle cx="50" cy="49" r="12" fill="url(#somaMobileGrad)" />
        <circle cx="46" cy="45" r="4" fill="hsla(320, 100%, 95%, 0.5)" />
        <circle cx="45" cy="44" r="2" fill="hsla(330, 100%, 98%, 0.7)" />
      </svg>

      {/* Mobile signal pulses - CSS-based */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 6,
            height: 6,
            background: 'hsl(180, 100%, 80%)',
            boxShadow: '0 0 8px hsl(180, 100%, 70%)',
            left: '50%',
            top: '10%',
          }}
          animate={{
            top: ['10%', '45%'],
            opacity: [0, 1, 1, 0],
            scale: [0.8, 1.2, 1, 0.8],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.8,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

// Desktop: Full premium animation with cascade effect
function DesktopBrain({ size = 200, brainCharge = 0 }: NeuralBrainProps) {
  const glowIntensity = 0.6 + (brainCharge / 100) * 0.4;
  
  // Dynamic signal frequency based on brain charge
  const signalFrequency = useMemo(() => {
    // Base: slower signals, High charge: rapid cascade
    const baseDelay = brainCharge > 70 ? 0.3 : brainCharge > 40 ? 0.6 : 1;
    const repeatDelay = brainCharge > 70 ? 0.5 : brainCharge > 40 ? 1.5 : 3;
    return { baseDelay, repeatDelay };
  }, [brainCharge]);

  // Number of active signals based on charge
  const activeSignals = brainCharge > 70 ? 8 : brainCharge > 40 ? 6 : 4;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Multi-layer ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: '25%',
          top: '30%',
          width: '50%',
          height: '40%',
          background: `radial-gradient(ellipse at 50% 50%, 
            hsla(300, 90%, 65%, ${glowIntensity * 0.6}) 0%, 
            hsla(280, 80%, 50%, ${glowIntensity * 0.3}) 40%, 
            transparent 70%)`,
        }}
        animate={{ 
          opacity: [0.5, 0.9, 0.5],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Extra cascade glow when charge is high */}
      {brainCharge > 50 && (
        <motion.div
          className="absolute rounded-full"
          style={{
            left: '20%',
            top: '25%',
            width: '60%',
            height: '50%',
            background: `radial-gradient(ellipse at 50% 50%, 
              hsla(180, 100%, 70%, ${(brainCharge - 50) / 100 * 0.4}) 0%, 
              transparent 60%)`,
          }}
          animate={{ 
            opacity: [0.3, 0.7, 0.3],
            scale: [0.95, 1.15, 0.95],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          {/* Soma glow filter */}
          <filter id="somaGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="1.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Signal glow filter */}
          <filter id="signalGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft dendrite glow */}
          <filter id="dendGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Premium soma gradient */}
          <radialGradient id="somaGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="hsl(320, 100%, 94%)" />
            <stop offset="25%" stopColor="hsl(310, 95%, 80%)" />
            <stop offset="50%" stopColor="hsl(295, 90%, 65%)" />
            <stop offset="75%" stopColor="hsl(280, 85%, 52%)" />
            <stop offset="100%" stopColor="hsl(270, 80%, 40%)" />
          </radialGradient>

          {/* Cyan dendrite gradient */}
          <linearGradient id="cyanGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="hsl(180, 100%, 70%)" />
            <stop offset="50%" stopColor="hsl(178, 95%, 60%)" />
            <stop offset="100%" stopColor="hsl(175, 90%, 50%)" stopOpacity="0.5" />
          </linearGradient>

          {/* Axon gradient */}
          <linearGradient id="axonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(180, 100%, 68%)" />
            <stop offset="100%" stopColor="hsl(178, 95%, 55%)" />
          </linearGradient>
        </defs>

        {/* === DENDRITES === */}
        <g stroke="url(#cyanGrad)" strokeLinecap="round" fill="none" filter="url(#dendGlow)">
          {dendriteBranches.map((branch, i) => (
            <path 
              key={i} 
              d={branch.d} 
              strokeWidth={branch.width} 
              opacity={0.85 - (i % 4) * 0.05}
            />
          ))}
        </g>

        {/* Dendrite tip bulbs with staggered pulse */}
        {dendriteTips.map((tip, i) => (
          <motion.circle
            key={`tip-${i}`}
            cx={tip.cx}
            cy={tip.cy}
            r="2"
            fill="hsl(180, 100%, 75%)"
            filter="url(#dendGlow)"
            animate={{ 
              opacity: [0.5, 1, 0.5], 
              r: [1.8, 2.4, 1.8] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: (i * 0.15) % 1.5, 
              ease: 'easeInOut' 
            }}
          />
        ))}

        {/* === AXON - Clean elegant line === */}
        <motion.path
          d="M50 54 Q48 65 46 76 Q44 84 42 92"
          stroke="url(#axonGrad)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          filter="url(#dendGlow)"
          animate={{
            strokeWidth: brainCharge > 60 ? [3.5, 4.2, 3.5] : 3.5,
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* === AXON TERMINALS === */}
        <g stroke="url(#axonGrad)" strokeLinecap="round" fill="none" filter="url(#dendGlow)">
          {axonTerminals.map((term, i) => (
            <path key={i} d={term.d} strokeWidth={term.width} opacity="0.8" />
          ))}
        </g>

        {/* Terminal bulbs */}
        {terminalTips.map((tip, i) => (
          <motion.circle
            key={`term-${i}`}
            cx={tip.cx}
            cy={tip.cy}
            r="2.5"
            fill="hsl(180, 100%, 78%)"
            filter="url(#signalGlow)"
            animate={{ 
              opacity: [0.5, 1, 0.5], 
              r: [2.2, 3, 2.2] 
            }}
            transition={{ 
              duration: 1.8, 
              repeat: Infinity, 
              delay: i * 0.2, 
              ease: 'easeInOut' 
            }}
          />
        ))}

        {/* === SOMA (Cell Body) === */}
        <g filter="url(#somaGlow)">
          {/* Outer pulse */}
          <motion.circle
            cx="50"
            cy="49"
            r="14"
            fill="hsla(290, 85%, 55%, 0.25)"
            animate={{ 
              r: brainCharge > 50 ? [14, 18, 14] : [14, 16, 14],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Main soma orb */}
          <motion.circle
            cx="50"
            cy="49"
            r="11"
            fill="url(#somaGrad)"
            animate={{ 
              r: brainCharge > 70 ? [11, 12.5, 11] : [11, 11.8, 11],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Inner highlights */}
          <circle cx="46" cy="45" r="5" fill="hsla(320, 100%, 94%, 0.4)" />
          <circle cx="45" cy="44" r="2.5" fill="hsla(325, 100%, 96%, 0.6)" />
          <circle cx="44" cy="43" r="1.2" fill="hsla(330, 100%, 98%, 0.8)" />
        </g>

        {/* === SIGNAL PULSES === */}
        {/* Incoming dendrite signals */}
        {signalPaths.slice(0, activeSignals).map((signal, i) => (
          signal.type === 'in' && (
            <motion.circle
              key={`sig-in-${i}`}
              r={brainCharge > 60 ? "3.5" : "3"}
              fill="hsl(180, 100%, 85%)"
              filter="url(#signalGlow)"
              animate={{ 
                opacity: [0, 1, 1, 0.8, 0], 
                offsetDistance: ['0%', '100%'],
              }}
              transition={{ 
                duration: brainCharge > 70 ? 0.8 : 1.2,
                repeat: Infinity, 
                repeatDelay: signalFrequency.repeatDelay,
                delay: i * signalFrequency.baseDelay,
                ease: 'easeIn',
              }}
              style={{ offsetPath: `path('${signal.path}')` }}
            />
          )
        ))}

        {/* Outgoing axon signal */}
        {signalPaths.filter(s => s.type === 'out').map((signal, i) => (
          <motion.circle
            key={`sig-out-${i}`}
            r={brainCharge > 60 ? "4" : "3.5"}
            fill="hsl(50, 100%, 75%)"
            filter="url(#signalGlow)"
            animate={{ 
              opacity: [0, 1, 1, 0], 
              offsetDistance: ['0%', '100%'],
            }}
            transition={{ 
              duration: brainCharge > 70 ? 0.6 : 1,
              repeat: Infinity, 
              repeatDelay: signalFrequency.repeatDelay * 0.8,
              delay: 0.5,
              ease: 'easeOut',
            }}
            style={{ offsetPath: `path('${signal.path}')` }}
          />
        ))}

        {/* CASCADE EFFECT - Extra rapid signals when charge is high */}
        {brainCharge > 60 && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <motion.circle
                key={`cascade-${i}`}
                r="2.5"
                fill="hsl(180, 100%, 90%)"
                filter="url(#signalGlow)"
                animate={{ 
                  opacity: [0, 0.8, 0.8, 0], 
                  offsetDistance: ['0%', '100%'],
                }}
                transition={{ 
                  duration: 0.6,
                  repeat: Infinity, 
                  repeatDelay: 0.3,
                  delay: i * 0.2,
                  ease: 'linear',
                }}
                style={{ offsetPath: `path('${signalPaths[i % signalPaths.length].path}')` }}
              />
            ))}
          </>
        )}

        {/* OVERDRIVE CASCADE - Even more signals at very high charge */}
        {brainCharge > 85 && (
          <>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <motion.circle
                key={`overdrive-${i}`}
                r="2"
                fill="hsl(60, 100%, 80%)"
                filter="url(#signalGlow)"
                animate={{ 
                  opacity: [0, 1, 0], 
                  offsetDistance: ['0%', '100%'],
                }}
                transition={{ 
                  duration: 0.4,
                  repeat: Infinity, 
                  repeatDelay: 0.15,
                  delay: i * 0.12,
                  ease: 'linear',
                }}
                style={{ offsetPath: `path('${signalPaths[i % 7].path}')` }}
              />
            ))}
          </>
        )}
      </svg>

      {/* Premium soma glow overlay */}
      <div 
        className="absolute flex items-center justify-center"
        style={{ 
          left: '42%', 
          top: '40%', 
          width: '16%', 
          height: '20%' 
        }}
      >
        <motion.div
          className="rounded-full"
          style={{ 
            width: '100%', 
            height: '100%',
          }}
          animate={{
            boxShadow: [
              `0 0 ${size * 0.06}px hsla(300, 95%, 65%, ${glowIntensity * 0.6}), 
               0 0 ${size * 0.12}px hsla(285, 90%, 55%, ${glowIntensity * 0.35}), 
               0 0 ${size * 0.2}px hsla(270, 85%, 50%, ${glowIntensity * 0.15})`,
              `0 0 ${size * 0.1}px hsla(300, 95%, 70%, ${glowIntensity * 0.85}), 
               0 0 ${size * 0.18}px hsla(285, 90%, 60%, ${glowIntensity * 0.5}), 
               0 0 ${size * 0.28}px hsla(270, 85%, 50%, ${glowIntensity * 0.25})`,
              `0 0 ${size * 0.06}px hsla(300, 95%, 65%, ${glowIntensity * 0.6}), 
               0 0 ${size * 0.12}px hsla(285, 90%, 55%, ${glowIntensity * 0.35}), 
               0 0 ${size * 0.2}px hsla(270, 85%, 50%, ${glowIntensity * 0.15})`,
            ],
            scale: brainCharge > 70 ? [1, 1.15, 1] : [1, 1.08, 1],
          }}
          transition={{ 
            duration: brainCharge > 70 ? 1.5 : 2.5, 
            repeat: Infinity, 
            ease: 'easeInOut' 
          }}
        />
      </div>
    </div>
  );
}

export function NeuralBrain({ size = 200, brainCharge = 0 }: NeuralBrainProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileBrain size={size} brainCharge={brainCharge} />;
  }
  return <DesktopBrain size={size} brainCharge={brainCharge} />;
}

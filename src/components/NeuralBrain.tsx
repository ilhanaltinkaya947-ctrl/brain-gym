import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMemo } from 'react';

interface NeuralBrainProps {
  size?: number;
  brainCharge?: number;
}

// Cleaner dendrite branches - less overlap, better structure
const dendriteBranches = [
  // Left side - spaced out fan
  { d: "M50 42 Q38 34 22 24", width: 2.2 },
  { d: "M22 24 Q14 18 8 14", width: 1.4 },
  { d: "M22 24 Q16 22 10 22", width: 1.2 },
  
  // Center-left
  { d: "M48 40 Q42 30 38 20", width: 2 },
  { d: "M38 20 Q34 14 30 10", width: 1.3 },
  { d: "M38 20 Q40 14 42 10", width: 1.1 },
  
  // Center
  { d: "M50 40 Q50 30 50 18", width: 2.2 },
  { d: "M50 18 Q46 12 42 8", width: 1.2 },
  { d: "M50 18 Q54 12 58 8", width: 1.2 },
  
  // Center-right
  { d: "M52 40 Q58 30 62 20", width: 2 },
  { d: "M62 20 Q66 14 70 10", width: 1.3 },
  { d: "M62 20 Q60 14 58 10", width: 1.1 },
  
  // Right side - spaced out fan
  { d: "M50 42 Q62 34 78 24", width: 2.2 },
  { d: "M78 24 Q86 18 92 14", width: 1.4 },
  { d: "M78 24 Q84 22 90 22", width: 1.2 },
  
  // Side extensions
  { d: "M44 46 Q30 44 16 42", width: 1.6 },
  { d: "M56 46 Q70 44 84 42", width: 1.6 },
];

// Dendrite tip positions - cleaned up
const dendriteTips = [
  { cx: 8, cy: 14 }, { cx: 10, cy: 22 },
  { cx: 30, cy: 10 }, { cx: 42, cy: 10 }, { cx: 42, cy: 8 },
  { cx: 50, cy: 18 },
  { cx: 58, cy: 10 }, { cx: 58, cy: 8 }, { cx: 70, cy: 10 },
  { cx: 92, cy: 14 }, { cx: 90, cy: 22 },
  { cx: 16, cy: 42 }, { cx: 84, cy: 42 },
];

// Axon path - adjusted to stay within bounds
const axonPath = "M50 52 Q49 60 48 68 Q46 76 44 82";

// Axon terminal branches - shortened to fit within viewBox
const axonTerminals = [
  { d: "M44 82 Q36 85 28 88", width: 1.4 },
  { d: "M28 88 Q22 90 18 91", width: 1 },
  { d: "M44 82 Q40 86 36 89", width: 1.2 },
  { d: "M44 82 Q44 86 44 90", width: 1.2 },
  { d: "M44 82 Q50 85 56 88", width: 1.4 },
  { d: "M56 88 Q62 90 68 91", width: 1 },
  { d: "M44 82 Q52 85 58 89", width: 1.2 },
];

// Terminal tip positions - adjusted
const terminalTips = [
  { cx: 18, cy: 91 }, { cx: 36, cy: 89 }, { cx: 44, cy: 90 },
  { cx: 58, cy: 89 }, { cx: 68, cy: 91 },
];

// Signal path definitions - updated
const signalPaths = [
  { path: "M8 14 Q14 18 22 24 Q38 34 50 42", type: 'in' },
  { path: "M92 14 Q86 18 78 24 Q62 34 50 42", type: 'in' },
  { path: "M30 10 Q34 14 38 20 Q42 30 48 40", type: 'in' },
  { path: "M70 10 Q66 14 62 20 Q58 30 52 40", type: 'in' },
  { path: "M50 18 Q50 30 50 40", type: 'in' },
  { path: "M16 42 Q30 44 44 46", type: 'in' },
  { path: "M84 42 Q70 44 56 46", type: 'in' },
  { path: axonPath, type: 'out' },
];

// Mobile: Optimized with clean design
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
          height: '25%',
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
            <circle key={i} cx={tip.cx} cy={tip.cy} r="1.6" />
          ))}
        </g>

        {/* Axon */}
        <path
          d={axonPath}
          stroke="hsl(180, 100%, 60%)"
          strokeWidth="2.8"
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
            <circle key={i} cx={tip.cx} cy={tip.cy} r="1.8" />
          ))}
        </g>

        {/* Soma */}
        <circle cx="50" cy="47" r="10" fill="url(#somaMobileGrad)" />
        <circle cx="46" cy="44" r="3.5" fill="hsla(320, 100%, 95%, 0.5)" />
        <circle cx="45" cy="43" r="1.5" fill="hsla(330, 100%, 98%, 0.7)" />
      </svg>

      {/* Mobile signal pulses */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 5,
            height: 5,
            background: 'hsl(180, 100%, 80%)',
            boxShadow: '0 0 6px hsl(180, 100%, 70%)',
            left: '50%',
            marginLeft: -2.5,
            top: '15%',
          }}
          animate={{
            top: ['15%', '42%'],
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

// Desktop: Full premium animation with trailing glow
function DesktopBrain({ size = 200, brainCharge = 0 }: NeuralBrainProps) {
  const glowIntensity = 0.6 + (brainCharge / 100) * 0.4;
  
  const signalFrequency = useMemo(() => {
    const baseDelay = brainCharge > 70 ? 0.3 : brainCharge > 40 ? 0.6 : 1;
    const repeatDelay = brainCharge > 70 ? 0.5 : brainCharge > 40 ? 1.5 : 3;
    return { baseDelay, repeatDelay };
  }, [brainCharge]);

  const activeSignals = brainCharge > 70 ? 7 : brainCharge > 40 ? 5 : 4;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Multi-layer ambient glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: '28%',
          top: '32%',
          width: '44%',
          height: '30%',
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
            left: '22%',
            top: '28%',
            width: '56%',
            height: '44%',
            background: `radial-gradient(ellipse at 50% 50%, 
              hsla(180, 100%, 70%, ${(brainCharge - 50) / 100 * 0.35}) 0%, 
              transparent 60%)`,
          }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            scale: [0.95, 1.12, 0.95],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <defs>
          {/* Soma glow filter */}
          <filter id="somaGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.5" result="blur1" />
            <feGaussianBlur stdDeviation="1.2" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Signal glow filter - enhanced for trailing effect */}
          <filter id="signalGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gold signal trail filter - extra glow for trailing effect */}
          <filter id="goldTrailGlow" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="2" result="blur2" />
            <feGaussianBlur stdDeviation="1" result="blur3" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur3" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft dendrite glow */}
          <filter id="dendGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.8" result="blur" />
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
            <stop offset="0%" stopColor="hsl(180, 100%, 68%)" />
            <stop offset="50%" stopColor="hsl(178, 95%, 58%)" />
            <stop offset="100%" stopColor="hsl(175, 90%, 48%)" stopOpacity="0.5" />
          </linearGradient>

          {/* Axon gradient */}
          <linearGradient id="axonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(180, 100%, 66%)" />
            <stop offset="100%" stopColor="hsl(178, 95%, 52%)" />
          </linearGradient>

          {/* Gold signal gradient for trailing effect */}
          <radialGradient id="goldSignalGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(50, 100%, 90%)" />
            <stop offset="40%" stopColor="hsl(45, 100%, 70%)" />
            <stop offset="100%" stopColor="hsl(40, 100%, 55%)" />
          </radialGradient>
        </defs>

        {/* === DENDRITES === */}
        <g stroke="url(#cyanGrad)" strokeLinecap="round" fill="none" filter="url(#dendGlow)">
          {dendriteBranches.map((branch, i) => (
            <path 
              key={i} 
              d={branch.d} 
              strokeWidth={branch.width} 
              opacity={0.85}
            />
          ))}
        </g>

        {/* Dendrite tip bulbs */}
        {dendriteTips.map((tip, i) => (
          <motion.circle
            key={`tip-${i}`}
            cx={tip.cx}
            cy={tip.cy}
            r="1.8"
            fill="hsl(180, 100%, 72%)"
            filter="url(#dendGlow)"
            animate={{ 
              opacity: [0.5, 1, 0.5], 
              r: [1.6, 2.2, 1.6] 
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              delay: (i * 0.12) % 1.2, 
              ease: 'easeInOut' 
            }}
          />
        ))}

        {/* === AXON === */}
        <motion.path
          d={axonPath}
          stroke="url(#axonGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          filter="url(#dendGlow)"
          animate={{
            strokeWidth: brainCharge > 60 ? [3, 3.8, 3] : 3,
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
            r="2.2"
            fill="hsl(180, 100%, 75%)"
            filter="url(#signalGlow)"
            animate={{ 
              opacity: [0.5, 1, 0.5], 
              r: [2, 2.8, 2] 
            }}
            transition={{ 
              duration: 1.8, 
              repeat: Infinity, 
              delay: i * 0.2, 
              ease: 'easeInOut' 
            }}
          />
        ))}

        {/* === SOMA === */}
        <g filter="url(#somaGlow)">
          {/* Outer pulse */}
          <motion.circle
            cx="50"
            cy="47"
            r="12"
            fill="hsla(290, 85%, 55%, 0.2)"
            animate={{ 
              r: brainCharge > 50 ? [12, 15, 12] : [12, 14, 12],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Main soma orb */}
          <motion.circle
            cx="50"
            cy="47"
            r="9"
            fill="url(#somaGrad)"
            animate={{ 
              r: brainCharge > 70 ? [9, 10.5, 9] : [9, 9.8, 9],
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Inner highlights */}
          <circle cx="46" cy="44" r="4" fill="hsla(320, 100%, 94%, 0.4)" />
          <circle cx="45" cy="43" r="2" fill="hsla(325, 100%, 96%, 0.6)" />
          <circle cx="44.5" cy="42.5" r="1" fill="hsla(330, 100%, 98%, 0.8)" />
        </g>

        {/* === INCOMING SIGNAL PULSES (cyan) === */}
        {signalPaths.slice(0, activeSignals).map((signal, i) => (
          signal.type === 'in' && (
            <motion.circle
              key={`sig-in-${i}`}
              r={brainCharge > 60 ? "3" : "2.5"}
              fill="hsl(180, 100%, 82%)"
              filter="url(#signalGlow)"
              animate={{ 
                opacity: [0, 1, 1, 0.6, 0], 
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

        {/* === GOLD AXON SIGNAL WITH TRAILING GLOW === */}
        {/* Trail particles - follow behind main signal */}
        {[0.15, 0.3, 0.45].map((trailOffset, i) => (
          <motion.circle
            key={`trail-${i}`}
            r={2.5 - i * 0.5}
            fill={`hsla(50, 100%, ${75 - i * 10}%, ${0.8 - i * 0.2})`}
            filter="url(#goldTrailGlow)"
            animate={{ 
              opacity: [0, 0.6 - i * 0.15, 0.6 - i * 0.15, 0], 
              offsetDistance: ['0%', '100%'],
            }}
            transition={{ 
              duration: brainCharge > 70 ? 0.7 : 1.1,
              repeat: Infinity, 
              repeatDelay: signalFrequency.repeatDelay * 0.8,
              delay: 0.5 + trailOffset,
              ease: 'easeOut',
            }}
            style={{ offsetPath: `path('${axonPath}')` }}
          />
        ))}
        
        {/* Main gold signal */}
        <motion.circle
          r={brainCharge > 60 ? "3.5" : "3"}
          fill="url(#goldSignalGrad)"
          filter="url(#goldTrailGlow)"
          animate={{ 
            opacity: [0, 1, 1, 0.7, 0], 
            offsetDistance: ['0%', '100%'],
          }}
          transition={{ 
            duration: brainCharge > 70 ? 0.7 : 1.1,
            repeat: Infinity, 
            repeatDelay: signalFrequency.repeatDelay * 0.8,
            delay: 0.5,
            ease: 'easeOut',
          }}
          style={{ offsetPath: `path('${axonPath}')` }}
        />

        {/* === CASCADE EFFECT - Extra signals when charge > 60 === */}
        {brainCharge > 60 && (
          <>
            {[0, 1, 2, 3].map((i) => (
              <motion.circle
                key={`cascade-${i}`}
                r="2"
                fill="hsl(180, 100%, 88%)"
                filter="url(#signalGlow)"
                animate={{ 
                  opacity: [0, 0.7, 0.7, 0], 
                  offsetDistance: ['0%', '100%'],
                }}
                transition={{ 
                  duration: 0.6,
                  repeat: Infinity, 
                  repeatDelay: 0.4,
                  delay: i * 0.18,
                  ease: 'linear',
                }}
                style={{ offsetPath: `path('${signalPaths[i % 7].path}')` }}
              />
            ))}
            
            {/* Extra gold trails in cascade */}
            {[0, 1].map((i) => (
              <motion.circle
                key={`cascade-gold-${i}`}
                r="2.5"
                fill="hsl(50, 100%, 75%)"
                filter="url(#goldTrailGlow)"
                animate={{ 
                  opacity: [0, 0.8, 0.6, 0], 
                  offsetDistance: ['0%', '100%'],
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity, 
                  repeatDelay: 0.6,
                  delay: 0.3 + i * 0.35,
                  ease: 'easeOut',
                }}
                style={{ offsetPath: `path('${axonPath}')` }}
              />
            ))}
          </>
        )}

        {/* === OVERDRIVE CASCADE - charge > 85 === */}
        {brainCharge > 85 && (
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.circle
                key={`overdrive-${i}`}
                r="1.8"
                fill="hsl(55, 100%, 80%)"
                filter="url(#signalGlow)"
                animate={{ 
                  opacity: [0, 0.9, 0], 
                  offsetDistance: ['0%', '100%'],
                }}
                transition={{ 
                  duration: 0.35,
                  repeat: Infinity, 
                  repeatDelay: 0.15,
                  delay: i * 0.1,
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
        className="absolute flex items-center justify-center pointer-events-none"
        style={{ 
          left: '43%', 
          top: '40%', 
          width: '14%', 
          height: '14%' 
        }}
      >
        <motion.div
          className="rounded-full w-full h-full"
          animate={{
            boxShadow: [
              `0 0 ${size * 0.05}px hsla(300, 95%, 65%, ${glowIntensity * 0.5}), 
               0 0 ${size * 0.1}px hsla(285, 90%, 55%, ${glowIntensity * 0.3})`,
              `0 0 ${size * 0.08}px hsla(300, 95%, 70%, ${glowIntensity * 0.75}), 
               0 0 ${size * 0.15}px hsla(285, 90%, 60%, ${glowIntensity * 0.45})`,
              `0 0 ${size * 0.05}px hsla(300, 95%, 65%, ${glowIntensity * 0.5}), 
               0 0 ${size * 0.1}px hsla(285, 90%, 55%, ${glowIntensity * 0.3})`,
            ],
            scale: brainCharge > 70 ? [1, 1.12, 1] : [1, 1.06, 1],
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

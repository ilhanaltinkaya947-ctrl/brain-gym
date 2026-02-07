import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface NeuralBrainProps {
  size?: number;
  brainCharge?: number;
}

// Mobile: Highly optimized CSS-only with beautiful static design
function MobileBrain({ size = 200 }: { size: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Deep ambient glow layers */}
      <div
        className="absolute inset-0 rounded-full animate-pulse"
        style={{
          background: `radial-gradient(circle at 50% 42%, 
            hsla(300, 85%, 60%, 0.35) 0%, 
            hsla(280, 75%, 50%, 0.15) 25%, 
            transparent 55%)`,
          animation: 'pulse 3s ease-in-out infinite',
        }}
      />

      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          {/* Premium soma gradient */}
          <radialGradient id="somaMobileGrad" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="hsl(320, 100%, 90%)" />
            <stop offset="25%" stopColor="hsl(310, 95%, 75%)" />
            <stop offset="50%" stopColor="hsl(295, 85%, 60%)" />
            <stop offset="75%" stopColor="hsl(280, 80%, 50%)" />
            <stop offset="100%" stopColor="hsl(270, 75%, 40%)" />
          </radialGradient>

          {/* Cyan dendrite gradient */}
          <linearGradient id="dendriteMobileGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="hsl(185, 100%, 70%)" />
            <stop offset="100%" stopColor="hsl(175, 90%, 50%)" stopOpacity="0.4" />
          </linearGradient>

          {/* Myelin pink gradient */}
          <linearGradient id="myelinMobileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(330, 70%, 85%)" />
            <stop offset="100%" stopColor="hsl(310, 60%, 75%)" />
          </linearGradient>

          {/* Soft glow filter */}
          <filter id="softGlowMobile" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* === DENDRITES - Organic branching structure === */}
        <g stroke="url(#dendriteMobileGrad)" strokeLinecap="round" fill="none" opacity="0.85">
          {/* Left major branch */}
          <path d="M50 42 Q38 32 25 18" strokeWidth="2.8" />
          <path d="M25 18 Q18 10 8 5" strokeWidth="1.8" />
          <path d="M25 18 Q20 12 12 10" strokeWidth="1.4" />
          <path d="M32 28 Q22 22 10 18" strokeWidth="1.6" />
          
          {/* Center-left branch */}
          <path d="M48 38 Q42 25 38 12" strokeWidth="2.4" />
          <path d="M38 12 Q34 5 28 2" strokeWidth="1.5" />
          <path d="M38 12 Q40 6 42 2" strokeWidth="1.3" />
          
          {/* Center branch */}
          <path d="M50 38 L50 18" strokeWidth="2.6" />
          <path d="M50 18 Q46 10 42 4" strokeWidth="1.6" />
          <path d="M50 18 Q54 10 58 4" strokeWidth="1.6" />
          <path d="M50 18 L50 6" strokeWidth="1.4" />
          
          {/* Center-right branch */}
          <path d="M52 38 Q58 25 62 12" strokeWidth="2.4" />
          <path d="M62 12 Q66 5 72 2" strokeWidth="1.5" />
          <path d="M62 12 Q60 6 58 2" strokeWidth="1.3" />
          
          {/* Right major branch */}
          <path d="M50 42 Q62 32 75 18" strokeWidth="2.8" />
          <path d="M75 18 Q82 10 92 5" strokeWidth="1.8" />
          <path d="M75 18 Q80 12 88 10" strokeWidth="1.4" />
          <path d="M68 28 Q78 22 90 18" strokeWidth="1.6" />
          
          {/* Side extensions */}
          <path d="M42 46 Q28 44 12 42" strokeWidth="2" />
          <path d="M58 46 Q72 44 88 42" strokeWidth="2" />
        </g>

        {/* Dendrite tip dots */}
        <g fill="hsl(185, 100%, 75%)" opacity="0.9">
          <circle cx="8" cy="5" r="2" />
          <circle cx="12" cy="10" r="1.5" />
          <circle cx="10" cy="18" r="1.5" />
          <circle cx="28" cy="2" r="1.8" />
          <circle cx="42" cy="2" r="1.5" />
          <circle cx="42" cy="4" r="1.5" />
          <circle cx="50" cy="6" r="1.8" />
          <circle cx="58" cy="4" r="1.5" />
          <circle cx="58" cy="2" r="1.5" />
          <circle cx="72" cy="2" r="1.8" />
          <circle cx="92" cy="5" r="2" />
          <circle cx="88" cy="10" r="1.5" />
          <circle cx="90" cy="18" r="1.5" />
          <circle cx="12" cy="42" r="1.8" />
          <circle cx="88" cy="42" r="1.8" />
        </g>

        {/* === AXON TRUNK === */}
        <path
          d="M50 56 Q50 62 48 70 Q46 78 44 85 Q42 90 40 95"
          stroke="hsl(185, 90%, 65%)"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.85"
        />

        {/* === MYELIN SHEATH SEGMENTS === */}
        <g fill="url(#myelinMobileGrad)" opacity="0.9">
          <ellipse cx="49" cy="62" rx="4.5" ry="5.5" />
          <ellipse cx="47" cy="74" rx="4" ry="5" />
          <ellipse cx="44" cy="85" rx="3.5" ry="4.5" />
        </g>

        {/* === AXON TERMINALS === */}
        <g stroke="hsl(185, 90%, 65%)" strokeLinecap="round" fill="none" opacity="0.8">
          <path d="M40 95 Q32 97 22 98" strokeWidth="1.6" />
          <path d="M22 98 Q16 99 10 99" strokeWidth="1.2" />
          <path d="M40 95 Q36 98 32 99" strokeWidth="1.4" />
          <path d="M40 95 Q40 98 40 100" strokeWidth="1.4" />
          <path d="M40 95 Q44 97 50 98" strokeWidth="1.6" />
          <path d="M50 98 Q56 99 62 99" strokeWidth="1.2" />
          <path d="M40 95 Q48 97 56 99" strokeWidth="1.4" />
        </g>

        {/* Terminal bulbs */}
        <g fill="hsl(180, 100%, 80%)" opacity="0.9">
          <circle cx="10" cy="99" r="2.2" />
          <circle cx="32" cy="99" r="2" />
          <circle cx="40" cy="100" r="2" />
          <circle cx="62" cy="99" r="2.2" />
          <circle cx="56" cy="99" r="2" />
        </g>

        {/* === SOMA (Cell Body) === */}
        <g filter="url(#softGlowMobile)">
          {/* Outer glow shape */}
          <path
            d="M50 38 Q57 40 60 38 Q63 44 61 50 Q64 56 60 60 Q56 63 50 60 Q44 63 40 60 Q36 56 39 50 Q37 44 40 38 Q43 40 50 38"
            fill="hsla(290, 80%, 55%, 0.3)"
            transform="scale(1.15) translate(-3.75, -3.5)"
          />
          
          {/* Main soma */}
          <path
            d="M50 38 Q57 40 60 38 Q63 44 61 50 Q64 56 60 60 Q56 63 50 60 Q44 63 40 60 Q36 56 39 50 Q37 44 40 38 Q43 40 50 38"
            fill="url(#somaMobileGrad)"
          />
          
          {/* Inner highlights */}
          <circle cx="45" cy="46" r="5" fill="hsla(320, 100%, 90%, 0.4)" />
          <circle cx="44" cy="44" r="2.5" fill="hsla(320, 100%, 95%, 0.6)" />
        </g>
      </svg>

      {/* Animated soma glow overlay */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-1%' }}>
        <motion.div
          className="rounded-full"
          style={{ 
            width: size * 0.22, 
            height: size * 0.22,
          }}
          animate={{
            boxShadow: [
              `0 0 ${size * 0.08}px hsla(300, 90%, 65%, 0.5), 0 0 ${size * 0.16}px hsla(280, 80%, 55%, 0.25)`,
              `0 0 ${size * 0.14}px hsla(300, 90%, 70%, 0.7), 0 0 ${size * 0.25}px hsla(280, 80%, 55%, 0.4)`,
              `0 0 ${size * 0.08}px hsla(300, 90%, 65%, 0.5), 0 0 ${size * 0.16}px hsla(280, 80%, 55%, 0.25)`,
            ],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

// Desktop: Full premium animation with signal pulses
function DesktopBrain({ size = 200, brainCharge = 0 }: NeuralBrainProps) {
  const glowIntensity = Math.max(0.7, brainCharge / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Multi-layer ambient glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 50% 42%, 
            hsla(300, 85%, 60%, ${glowIntensity * 0.35}) 0%, 
            hsla(280, 75%, 50%, ${glowIntensity * 0.15}) 30%, 
            transparent 60%)`,
        }}
        animate={{ 
          opacity: [0.6, 1, 0.6],
          scale: [1, 1.02, 1],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          {/* === FILTERS === */}
          {/* Soma intense glow */}
          <filter id="somaGlow" x="-150%" y="-150%" width="400%" height="400%">
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

          {/* Dendrite soft glow */}
          <filter id="dendriteGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Signal bright glow */}
          <filter id="signalGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="1.5" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* === GRADIENTS === */}
          {/* Premium soma - rich magenta/pink */}
          <radialGradient id="somaGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="hsl(320, 100%, 92%)" />
            <stop offset="20%" stopColor="hsl(315, 95%, 80%)" />
            <stop offset="40%" stopColor="hsl(305, 90%, 68%)" />
            <stop offset="60%" stopColor="hsl(290, 85%, 55%)" />
            <stop offset="80%" stopColor="hsl(280, 80%, 45%)" />
            <stop offset="100%" stopColor="hsl(270, 75%, 35%)" />
          </radialGradient>

          {/* Dendrite - vibrant cyan/teal */}
          <linearGradient id="dendriteGrad" x1="50%" y1="100%" x2="50%" y2="0%">
            <stop offset="0%" stopColor="hsl(185, 100%, 72%)" />
            <stop offset="40%" stopColor="hsl(180, 95%, 62%)" />
            <stop offset="100%" stopColor="hsl(175, 90%, 50%)" stopOpacity="0.5" />
          </linearGradient>

          {/* Myelin - soft pink flesh tone */}
          <linearGradient id="myelinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(330, 75%, 88%)" />
            <stop offset="50%" stopColor="hsl(320, 65%, 80%)" />
            <stop offset="100%" stopColor="hsl(310, 55%, 72%)" />
          </linearGradient>

          {/* Axon gradient */}
          <linearGradient id="axonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(185, 95%, 70%)" />
            <stop offset="100%" stopColor="hsl(180, 90%, 58%)" />
          </linearGradient>
        </defs>

        {/* === DENDRITES (Top Branches) === */}
        <g stroke="url(#dendriteGrad)" strokeLinecap="round" fill="none" filter="url(#dendriteGlow)">
          {/* Left major branch */}
          <path d="M50 42 Q38 32 25 18" strokeWidth="3" opacity="0.9" />
          <path d="M25 18 Q18 10 8 5" strokeWidth="2" opacity="0.85" />
          <path d="M25 18 Q20 12 12 10" strokeWidth="1.6" opacity="0.8" />
          <path d="M32 28 Q22 22 10 18" strokeWidth="1.8" opacity="0.8" />
          <path d="M8 5 Q4 2 2 1" strokeWidth="1.2" opacity="0.7" />
          <path d="M12 10 Q8 6 5 5" strokeWidth="1.2" opacity="0.7" />
          
          {/* Center-left branch */}
          <path d="M48 38 Q42 25 38 12" strokeWidth="2.6" opacity="0.9" />
          <path d="M38 12 Q34 5 28 2" strokeWidth="1.7" opacity="0.85" />
          <path d="M38 12 Q40 6 42 2" strokeWidth="1.5" opacity="0.8" />
          <path d="M42 22 Q36 16 30 12" strokeWidth="1.4" opacity="0.75" />
          
          {/* Center branch */}
          <path d="M50 38 L50 18" strokeWidth="2.8" opacity="0.9" />
          <path d="M50 18 Q46 10 42 4" strokeWidth="1.8" opacity="0.85" />
          <path d="M50 18 Q54 10 58 4" strokeWidth="1.8" opacity="0.85" />
          <path d="M50 18 L50 6" strokeWidth="1.6" opacity="0.8" />
          <path d="M50 6 Q48 3 46 1" strokeWidth="1.2" opacity="0.7" />
          <path d="M50 6 Q52 3 54 1" strokeWidth="1.2" opacity="0.7" />
          
          {/* Center-right branch */}
          <path d="M52 38 Q58 25 62 12" strokeWidth="2.6" opacity="0.9" />
          <path d="M62 12 Q66 5 72 2" strokeWidth="1.7" opacity="0.85" />
          <path d="M62 12 Q60 6 58 2" strokeWidth="1.5" opacity="0.8" />
          <path d="M58 22 Q64 16 70 12" strokeWidth="1.4" opacity="0.75" />
          
          {/* Right major branch */}
          <path d="M50 42 Q62 32 75 18" strokeWidth="3" opacity="0.9" />
          <path d="M75 18 Q82 10 92 5" strokeWidth="2" opacity="0.85" />
          <path d="M75 18 Q80 12 88 10" strokeWidth="1.6" opacity="0.8" />
          <path d="M68 28 Q78 22 90 18" strokeWidth="1.8" opacity="0.8" />
          <path d="M92 5 Q96 2 98 1" strokeWidth="1.2" opacity="0.7" />
          <path d="M88 10 Q92 6 95 5" strokeWidth="1.2" opacity="0.7" />
          
          {/* Side extensions */}
          <path d="M42 46 Q28 44 12 42" strokeWidth="2.2" opacity="0.85" />
          <path d="M12 42 Q6 41 2 40" strokeWidth="1.4" opacity="0.75" />
          <path d="M58 46 Q72 44 88 42" strokeWidth="2.2" opacity="0.85" />
          <path d="M88 42 Q94 41 98 40" strokeWidth="1.4" opacity="0.75" />
        </g>

        {/* Dendrite tip bulbs with pulse */}
        {[
          { cx: 2, cy: 1, r: 2.2, delay: 0 },
          { cx: 5, cy: 5, r: 1.8, delay: 0.2 },
          { cx: 8, cy: 5, r: 2.5, delay: 0.1 },
          { cx: 12, cy: 10, r: 1.8, delay: 0.3 },
          { cx: 10, cy: 18, r: 1.8, delay: 0.4 },
          { cx: 28, cy: 2, r: 2.2, delay: 0.15 },
          { cx: 30, cy: 12, r: 1.6, delay: 0.5 },
          { cx: 42, cy: 2, r: 2, delay: 0.25 },
          { cx: 42, cy: 4, r: 1.8, delay: 0.35 },
          { cx: 46, cy: 1, r: 1.8, delay: 0.45 },
          { cx: 50, cy: 6, r: 2.2, delay: 0.2 },
          { cx: 54, cy: 1, r: 1.8, delay: 0.55 },
          { cx: 58, cy: 4, r: 1.8, delay: 0.3 },
          { cx: 58, cy: 2, r: 2, delay: 0.4 },
          { cx: 70, cy: 12, r: 1.6, delay: 0.6 },
          { cx: 72, cy: 2, r: 2.2, delay: 0.1 },
          { cx: 88, cy: 10, r: 1.8, delay: 0.5 },
          { cx: 90, cy: 18, r: 1.8, delay: 0.35 },
          { cx: 92, cy: 5, r: 2.5, delay: 0.25 },
          { cx: 95, cy: 5, r: 1.8, delay: 0.45 },
          { cx: 98, cy: 1, r: 2.2, delay: 0.15 },
          { cx: 2, cy: 40, r: 2, delay: 0.6 },
          { cx: 98, cy: 40, r: 2, delay: 0.55 },
        ].map((dot, i) => (
          <motion.circle
            key={`dendrite-tip-${i}`}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill="hsl(185, 100%, 78%)"
            filter="url(#dendriteGlow)"
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.1, 0.9] }}
            style={{ transformOrigin: `${dot.cx}px ${dot.cy}px` }}
            transition={{ duration: 2.5, repeat: Infinity, delay: dot.delay, ease: 'easeInOut' }}
          />
        ))}

        {/* === AXON TRUNK === */}
        <path
          d="M50 56 Q50 62 48 70 Q46 78 44 85 Q42 90 40 95"
          stroke="url(#axonGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
          filter="url(#dendriteGlow)"
        />

        {/* === MYELIN SHEATH SEGMENTS === */}
        {[
          { cx: 49, cy: 62, rx: 5, ry: 6, delay: 0 },
          { cx: 47, cy: 74, rx: 4.5, ry: 5.5, delay: 0.3 },
          { cx: 44, cy: 85, rx: 4, ry: 5, delay: 0.6 },
        ].map((seg, i) => (
          <motion.ellipse
            key={`myelin-${i}`}
            cx={seg.cx}
            cy={seg.cy}
            rx={seg.rx}
            ry={seg.ry}
            fill="url(#myelinGrad)"
            filter="url(#dendriteGlow)"
            animate={{ 
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.03, 1],
            }}
            style={{ transformOrigin: `${seg.cx}px ${seg.cy}px` }}
            transition={{ duration: 4, repeat: Infinity, delay: seg.delay, ease: 'easeInOut' }}
          />
        ))}

        {/* === AXON TERMINALS === */}
        <g stroke="url(#axonGrad)" strokeLinecap="round" fill="none" filter="url(#dendriteGlow)">
          <path d="M40 95 Q32 97 22 98" strokeWidth="1.8" opacity="0.85" />
          <path d="M22 98 Q16 99 10 99" strokeWidth="1.3" opacity="0.8" />
          <path d="M40 95 Q36 98 32 99" strokeWidth="1.5" opacity="0.85" />
          <path d="M40 95 Q40 98 40 100" strokeWidth="1.5" opacity="0.85" />
          <path d="M40 95 Q44 97 50 98" strokeWidth="1.8" opacity="0.85" />
          <path d="M50 98 Q56 99 62 99" strokeWidth="1.3" opacity="0.8" />
          <path d="M40 95 Q48 97 56 99" strokeWidth="1.5" opacity="0.85" />
        </g>

        {/* Terminal bulbs */}
        {[
          { cx: 10, cy: 99, delay: 0 },
          { cx: 32, cy: 99, delay: 0.15 },
          { cx: 40, cy: 100, delay: 0.3 },
          { cx: 56, cy: 99, delay: 0.45 },
          { cx: 62, cy: 99, delay: 0.6 },
        ].map((dot, i) => (
          <motion.circle
            key={`terminal-${i}`}
            cx={dot.cx}
            cy={dot.cy}
            r="2.8"
            fill="hsl(180, 100%, 80%)"
            filter="url(#signalGlow)"
            animate={{ opacity: [0.5, 1, 0.5], scale: [0.9, 1.15, 0.9] }}
            style={{ transformOrigin: `${dot.cx}px ${dot.cy}px` }}
            transition={{ duration: 2, repeat: Infinity, delay: dot.delay, ease: 'easeInOut' }}
          />
        ))}

        {/* === SOMA (Cell Body) === */}
        <g filter="url(#somaGlow)">
          {/* Outer glow layer */}
          <motion.path
            d="M50 36 Q58 39 62 36 Q66 43 63 50 Q67 58 62 63 Q57 67 50 63 Q43 67 38 63 Q33 58 37 50 Q34 43 38 36 Q42 39 50 36"
            fill="hsla(290, 80%, 55%, 0.25)"
            animate={{ scale: [1, 1.12, 1], opacity: [0.2, 0.35, 0.2] }}
            style={{ transformOrigin: '50px 50px' }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Main soma body */}
          <motion.path
            d="M50 38 Q57 40 60 38 Q63 44 61 50 Q64 56 60 60 Q56 63 50 60 Q44 63 40 60 Q36 56 39 50 Q37 44 40 38 Q43 40 50 38"
            fill="url(#somaGrad)"
            animate={{ 
              scale: [1, 1.06, 1],
            }}
            style={{ transformOrigin: '50px 50px' }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          
          {/* Inner highlight layers */}
          <circle cx="45" cy="46" r="6" fill="hsla(320, 100%, 92%, 0.35)" />
          <circle cx="44" cy="44" r="3.5" fill="hsla(320, 100%, 95%, 0.5)" />
          <circle cx="43" cy="43" r="1.8" fill="hsla(330, 100%, 98%, 0.7)" />
        </g>

        {/* === SIGNAL PULSES === */}
        {/* Dendrite signals (traveling toward soma) */}
        {[
          { path: "M8 5 Q18 10 25 18 Q38 32 50 42", delay: 0, duration: 1.8 },
          { path: "M92 5 Q82 10 75 18 Q62 32 50 42", delay: 2.5, duration: 1.8 },
          { path: "M28 2 Q34 5 38 12 Q42 25 48 38", delay: 1, duration: 1.6 },
          { path: "M72 2 Q66 5 62 12 Q58 25 52 38", delay: 3.5, duration: 1.6 },
          { path: "M50 6 L50 18 L50 38", delay: 4.5, duration: 1.4 },
          { path: "M2 40 Q6 41 12 42 Q28 44 42 46", delay: 5.5, duration: 1.5 },
          { path: "M98 40 Q94 41 88 42 Q72 44 58 46", delay: 6.5, duration: 1.5 },
        ].map((signal, i) => (
          <motion.circle
            key={`signal-in-${i}`}
            r="3"
            fill="hsl(180, 100%, 85%)"
            filter="url(#signalGlow)"
            animate={{ 
              opacity: [0, 1, 1, 0], 
              offsetDistance: ['0%', '100%'] 
            }}
            transition={{ 
              duration: signal.duration, 
              repeat: Infinity, 
              repeatDelay: 7,
              delay: signal.delay, 
              ease: 'easeIn' 
            }}
            style={{ offsetPath: `path('${signal.path}')` }}
          />
        ))}

        {/* Axon signal (traveling away from soma) */}
        <motion.circle
          r="3.5"
          fill="hsl(180, 100%, 88%)"
          filter="url(#signalGlow)"
          animate={{ 
            opacity: [0, 1, 1, 0], 
            offsetDistance: ['0%', '100%'] 
          }}
          transition={{ 
            duration: 1.4, 
            repeat: Infinity, 
            repeatDelay: 3,
            delay: 1.5, 
            ease: 'easeOut' 
          }}
          style={{ offsetPath: "path('M50 56 Q50 62 48 70 Q46 78 44 85 Q42 90 40 95')" }}
        />
      </svg>

      {/* Premium soma glow overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="rounded-full"
          style={{ 
            width: size * 0.24, 
            height: size * 0.24,
          }}
          animate={{
            boxShadow: [
              `0 0 ${size * 0.08}px hsla(300, 95%, 65%, 0.5), 0 0 ${size * 0.16}px hsla(285, 85%, 55%, 0.3), 0 0 ${size * 0.25}px hsla(270, 75%, 50%, 0.15)`,
              `0 0 ${size * 0.14}px hsla(300, 95%, 70%, 0.75), 0 0 ${size * 0.24}px hsla(285, 85%, 60%, 0.45), 0 0 ${size * 0.35}px hsla(270, 75%, 50%, 0.25)`,
              `0 0 ${size * 0.08}px hsla(300, 95%, 65%, 0.5), 0 0 ${size * 0.16}px hsla(285, 85%, 55%, 0.3), 0 0 ${size * 0.25}px hsla(270, 75%, 50%, 0.15)`,
            ],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
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

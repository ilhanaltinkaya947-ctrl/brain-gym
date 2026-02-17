import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

interface NeuralCoreProps {
  size?: number;
  brainCharge?: number;
}

// Helper to create organic curved paths (Bézier)
const createDendritePath = (angle: number, length: number, curvature: number) => {
  const endX = Math.cos(angle) * length;
  const endY = Math.sin(angle) * length;

  const cp1X = Math.cos(angle - curvature) * (length * 0.45);
  const cp1Y = Math.sin(angle - curvature) * (length * 0.45);
  const cp2X = Math.cos(angle + curvature) * (length * 0.75);
  const cp2Y = Math.sin(angle + curvature) * (length * 0.75);

  return `M 0 0 C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
};

// Reverse a path so signals travel from tip → soma
const reversePath = (angle: number, length: number, curvature: number) => {
  const endX = Math.cos(angle) * length;
  const endY = Math.sin(angle) * length;

  const cp1X = Math.cos(angle - curvature) * (length * 0.45);
  const cp1Y = Math.sin(angle - curvature) * (length * 0.45);
  const cp2X = Math.cos(angle + curvature) * (length * 0.75);
  const cp2Y = Math.sin(angle + curvature) * (length * 0.75);

  return `M ${endX.toFixed(1)} ${endY.toFixed(1)} C ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, 0 0`;
};

interface Branch {
  d: string;
  reversedD: string;
  width: number;
  delay: number;
  duration: number;
  swayDuration: number;
  isSub: boolean;
  angle: number;
  length: number;
  curvature: number;
}

function generateDendrites(isMobile: boolean): Branch[] {
  const branches: Branch[] = [];
  const count = isMobile ? 10 : 12;
  const subCount = isMobile ? 1 : 2;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const length = 110 + Math.random() * 30;
    const curvature = 0.2 + Math.random() * 0.4;

    branches.push({
      d: createDendritePath(angle, length, curvature),
      reversedD: reversePath(angle, length, curvature),
      width: 2.5 + Math.random(),
      delay: Math.random() * 5,
      duration: 14 + Math.random() * 6,
      swayDuration: 18 + Math.random() * 7,
      isSub: false,
      angle,
      length,
      curvature,
    });

    for (let j = 0; j < subCount; j++) {
      const subAngle = angle + (Math.random() - 0.5) * 0.6;
      const subLength = length * (0.5 + Math.random() * 0.3);
      branches.push({
        d: createDendritePath(subAngle, subLength, -curvature),
        reversedD: reversePath(subAngle, subLength, -curvature),
        width: 1 + Math.random(),
        delay: Math.random() * 5,
        duration: 14 + Math.random() * 6,
        swayDuration: 18 + Math.random() * 7,
        isSub: true,
        angle: subAngle,
        length: subLength,
        curvature: -curvature,
      });
    }
  }
  return branches;
}

interface FloatingParticle {
  radius: number;     // orbital radius from center
  size: number;       // circle radius 1-3px
  angle: number;      // starting angle offset
  orbitDuration: number; // 45-80s
  opacityDuration: number; // 4-8s
  scaleY: number;     // 0.6-0.85 for elliptical orbit
}

function generateFloatingParticles(isMobile: boolean): FloatingParticle[] {
  const count = isMobile ? 12 : 16;
  const particles: FloatingParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      radius: 40 + Math.random() * 80,
      size: 1 + Math.random() * 2,
      angle: (i / count) * 360,
      orbitDuration: 45 + Math.random() * 35,
      opacityDuration: 4 + Math.random() * 4,
      scaleY: 0.6 + Math.random() * 0.25,
    });
  }
  return particles;
}

interface OrbitalDot {
  angle: number;
  opacityDuration: number; // 4-9s
  delay: number;
}

function generateOrbitalDots(isMobile: boolean): OrbitalDot[] {
  const count = isMobile ? 8 : 10;
  const dots: OrbitalDot[] = [];
  for (let i = 0; i < count; i++) {
    dots.push({
      angle: (i / count) * 360,
      opacityDuration: 4 + Math.random() * 5,
      delay: Math.random() * 3,
    });
  }
  return dots;
}

const NeuralCoreInner = ({ size = 300, brainCharge = 50 }: NeuralCoreProps) => {
  const isMobile = useIsMobile();
  const charge = Math.max(0, Math.min(100, brainCharge));

  // Derived charge values
  const glowIntensity = 0.4 + (charge / 100) * 0.6;
  const signalSpeed = charge > 70 ? 4 : charge > 40 ? 6.5 : 8;
  const signalDelay = charge > 70 ? 3.5 : charge > 40 ? 5.5 : 7;
  const activeSignalCount = charge > 80 ? (isMobile ? 4 : 6) : charge > 50 ? (isMobile ? 3 : 5) : charge > 20 ? (isMobile ? 2 : 3) : 2;
  const somaBreathSpeed = charge > 70 ? 6 : charge > 40 ? 8 : 10;
  const isLowCharge = charge <= 20;

  // Generate dendrites once on mount
  const dendrites = useMemo(() => generateDendrites(isMobile), [isMobile]);
  const floatingParticles = useMemo(() => generateFloatingParticles(isMobile), [isMobile]);
  const orbitalDots = useMemo(() => generateOrbitalDots(isMobile), [isMobile]);

  const mainBranches = useMemo(() => dendrites.filter(b => !b.isSub), [dendrites]);
  const signalBranches = mainBranches.slice(0, activeSignalCount);

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer charge glow — scales with brainCharge */}
      {charge > 20 && (
        <>
          <motion.div
            className="absolute rounded-full"
            style={{
              width: '70%',
              height: '70%',
              background: `radial-gradient(circle,
                hsla(180, 100%, 70%, ${glowIntensity * 0.2}) 0%,
                hsla(270, 80%, 60%, ${glowIntensity * 0.08}) 50%,
                transparent 70%)`,
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.15, 1],
            }}
            transition={{ duration: somaBreathSpeed * 0.8, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Second deeper glow layer */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: '85%',
              height: '85%',
              background: `radial-gradient(circle,
                hsla(180, 100%, 70%, ${glowIntensity * 0.08}) 0%,
                hsla(270, 80%, 60%, ${glowIntensity * 0.04}) 40%,
                transparent 70%)`,
            }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: somaBreathSpeed * 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      <motion.svg
        width={size}
        height={size}
        viewBox="-150 -150 300 300"
        className="overflow-visible"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        <defs>
          {/* Base gradient — shifts warmer at high charge */}
          <radialGradient id="neuronGradient" cx="0" cy="0" r="100%" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="30%" stopColor={charge > 70 ? '#00FFD5' : 'hsl(var(--neon-cyan))'} stopOpacity={0.7 + glowIntensity * 0.3} />
            <stop offset="100%" stopColor={charge > 80 ? '#A855F7' : '#8B5CF6'} stopOpacity={0.05 + glowIntensity * 0.15} />
          </radialGradient>

          {/* Signal pulse gradient */}
          <radialGradient id="signalGrad">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="50%" stopColor="#00E5FF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </radialGradient>

          {/* Gold output signal gradient */}
          <radialGradient id="goldSignalGrad">
            <stop offset="0%" stopColor="#FFFDE0" stopOpacity="1" />
            <stop offset="50%" stopColor="#FBBF24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>

          {/* Particle gradient — soft glowing-core */}
          <radialGradient id="particleGrad">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#00E5FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </radialGradient>

          {/* Single glow filter — applied to groups, NOT individual elements */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Signal glow — only on signal group */}
          <filter id="signalGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soma glow — static stdDeviation for cache-friendliness */}
          <filter id="somaGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="2" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* === FLOATING AMBIENT PARTICLES — behind everything === */}
        <g>
          {floatingParticles.map((p, i) => (
            <motion.g
              key={`fp-${i}`}
              style={{ scaleY: p.scaleY }}
              animate={{ rotate: 360 }}
              transition={{
                duration: p.orbitDuration,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <motion.circle
                cx={Math.cos((p.angle * Math.PI) / 180) * p.radius}
                cy={Math.sin((p.angle * Math.PI) / 180) * p.radius}
                r={p.size}
                fill="url(#particleGrad)"
                animate={{ opacity: [0.15, 0.5, 0.15] }}
                transition={{
                  duration: p.opacityDuration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.3,
                }}
              />
            </motion.g>
          ))}
        </g>

        {/* === SLOW SPINNING ORBITAL RING === */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 75, repeat: Infinity, ease: 'linear' }}
        >
          {orbitalDots.map((dot, i) => (
            <motion.circle
              key={`orb-${i}`}
              cx={Math.cos((dot.angle * Math.PI) / 180) * 70}
              cy={Math.sin((dot.angle * Math.PI) / 180) * 70}
              r={1.5}
              fill="#00E5FF"
              animate={{ opacity: [0.1, 0.5, 0.1] }}
              transition={{
                duration: dot.opacityDuration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: dot.delay,
              }}
            />
          ))}
        </motion.g>

        {/* === DENDRITES — filter on group, not per-element === */}
        <g filter="url(#glow)">
          {dendrites.map((branch, i) => (
            <motion.g
              key={i}
              animate={{ rotate: [-2, 2, -2] }}
              transition={{
                duration: branch.swayDuration,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* At low charge, render static paths for performance */}
              {isLowCharge ? (
                <path
                  d={branch.d}
                  stroke="url(#neuronGradient)"
                  strokeWidth={branch.width}
                  strokeLinecap="round"
                  fill="none"
                  opacity={branch.isSub ? 0.4 : 0.6}
                />
              ) : (
                <motion.path
                  d={branch.d}
                  stroke="url(#neuronGradient)"
                  strokeLinecap="round"
                  fill="none"
                  initial={{ opacity: 0.4 }}
                  animate={{
                    opacity: branch.isSub
                      ? [0.3, 0.3 + glowIntensity * 0.4, 0.3]
                      : [0.5 + glowIntensity * 0.1, 0.6 + glowIntensity * 0.4, 0.5 + glowIntensity * 0.1],
                    strokeWidth: branch.isSub
                      ? branch.width
                      : [branch.width, branch.width + 0.4, branch.width],
                  }}
                  transition={{
                    duration: branch.duration,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: branch.delay
                  }}
                />
              )}

              {/* Synaptic Terminal — no individual filter */}
              <motion.circle
                r={branch.isSub ? 1.5 : 3}
                fill="#fff"
                style={{ offsetPath: `path('${branch.d}')`, offsetDistance: "100%" }}
                animate={{
                  opacity: [0.2, 0.7 + glowIntensity * 0.3, 0.2],
                  scale: [0.8, 1 + glowIntensity * 0.3, 0.8]
                }}
                transition={{
                  duration: branch.duration * 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: branch.delay + 1
                }}
              />
            </motion.g>
          ))}
        </g>

        {/* === SIGNAL PULSES — single filter on group === */}
        <g filter="url(#signalGlow)">
          {/* Incoming signals (tip → soma) */}
          {signalBranches.map((branch, i) => (
            <React.Fragment key={`signal-${i}`}>
              <motion.circle
                r={2.5 + glowIntensity * 0.5}
                fill="url(#signalGrad)"
                style={{ offsetPath: `path('${branch.reversedD}')` }}
                animate={{
                  offsetDistance: ['0%', '100%'],
                  opacity: [0, 0.5, 0.7, 0.5, 0],
                }}
                transition={{
                  duration: signalSpeed,
                  repeat: Infinity,
                  repeatDelay: signalDelay,
                  delay: i * (signalDelay / activeSignalCount),
                  ease: [0.4, 0.0, 0.2, 1],
                }}
              />

              {/* Trailing glow */}
              <motion.circle
                r={3 + glowIntensity * 0.6}
                fill="#00E5FF"
                style={{ offsetPath: `path('${branch.reversedD}')` }}
                animate={{
                  offsetDistance: ['0%', '100%'],
                  opacity: [0, 0.3, 0.2, 0],
                }}
                transition={{
                  duration: signalSpeed,
                  repeat: Infinity,
                  repeatDelay: signalDelay,
                  delay: i * (signalDelay / activeSignalCount) + 0.15,
                  ease: [0.4, 0.0, 0.2, 1],
                }}
              />
            </React.Fragment>
          ))}

          {/* Outgoing gold signals (soma → tip) */}
          {charge > 40 && signalBranches.slice(0, Math.floor(activeSignalCount / 3)).map((branch, i) => (
            <motion.circle
              key={`out-${i}`}
              r={2.5 + glowIntensity * 0.5}
              fill="url(#goldSignalGrad)"
              style={{ offsetPath: `path('${branch.d}')` }}
              animate={{
                offsetDistance: ['0%', '100%'],
                opacity: [0, 0.5, 0.6, 0.3, 0],
              }}
              transition={{
                duration: signalSpeed * 1.5,
                repeat: Infinity,
                repeatDelay: signalDelay * 1.5,
                delay: i * 1.2 + 0.5,
                ease: [0.4, 0.0, 0.2, 1],
              }}
            />
          ))}

        </g>

        {/* === SOMA === */}
        <g filter="url(#somaGlow)">
          {/* Outer concentric ring — r=38, slowest */}
          <motion.circle
            cx="0"
            cy="0"
            r="38"
            fill="none"
            stroke={`hsla(180, 100%, 70%, ${0.08 + glowIntensity * 0.12})`}
            strokeWidth="0.8"
            animate={{
              r: [38, 38 + glowIntensity * 5, 38],
              opacity: [0.05, 0.15 + glowIntensity * 0.15, 0.05],
            }}
            transition={{
              duration: somaBreathSpeed * 1.3,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: somaBreathSpeed * 0.4,
            }}
          />

          {/* Middle concentric ring — r=32 */}
          <motion.circle
            cx="0"
            cy="0"
            r="32"
            fill="none"
            stroke={`hsla(180, 100%, 70%, ${0.1 + glowIntensity * 0.12})`}
            strokeWidth="1"
            animate={{
              r: [32, 32 + glowIntensity * 6, 32],
              opacity: [0.08, 0.2 + glowIntensity * 0.15, 0.08],
            }}
            transition={{
              duration: somaBreathSpeed * 1.1,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: somaBreathSpeed * 0.2,
            }}
          />

          {/* Existing outer pulse ring — r=26, enhanced */}
          <motion.circle
            cx="0"
            cy="0"
            r={26 + glowIntensity * 4}
            fill={`hsla(180, 100%, 70%, ${0.05 + glowIntensity * 0.1})`}
            animate={{
              r: [26, 26 + glowIntensity * 10, 26],
              opacity: [0.1, 0.15 + glowIntensity * 0.2, 0.1],
            }}
            transition={{ duration: somaBreathSpeed, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Main Soma — more pronounced breathing */}
          <motion.circle
            cx="0"
            cy="0"
            r="22"
            fill="url(#neuronGradient)"
            animate={{
              scale: [0.93, 0.93 + glowIntensity * 0.16, 0.93],
              opacity: [0.85, 0.85 + glowIntensity * 0.15, 0.85]
            }}
            transition={{
              duration: somaBreathSpeed,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </g>

        {/* Core Light */}
        <motion.circle
          cx="0"
          cy="0"
          r="8"
          fill="#FFFFFF"
          animate={{
            opacity: [0.6 + glowIntensity * 0.1, 0.8 + glowIntensity * 0.2, 0.6 + glowIntensity * 0.1],
            scale: [1, 1 + glowIntensity * 0.15, 1],
          }}
          transition={{ duration: somaBreathSpeed * 0.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Inner highlight */}
        <circle cx="-3" cy="-3" r="3.5" fill="hsla(0, 0%, 100%, 0.35)" />
      </motion.svg>
    </div>
  );
};

export const NeuralCore = React.memo(NeuralCoreInner);

export default NeuralCore;

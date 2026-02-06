import { useEffect, useRef, useMemo } from 'react';
import { AdaptivePhase } from '@/hooks/useAdaptiveEngine';

interface HeatBackgroundProps {
  gameSpeed: number;
  phase: AdaptivePhase;
  tier?: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number[];
}

// Tier-based color palettes (difficulty progression)
const TIER_COLORS = {
  1: { // Basics - Calm Teal
    primary: { h: 173, s: 80, l: 40 },
    secondary: { h: 180, s: 70, l: 45 },
    background: ['hsl(0, 0%, 0%)', 'hsl(173, 30%, 5%)', 'hsl(180, 20%, 3%)'],
  },
  2: { // Focus - Electric Blue
    primary: { h: 210, s: 100, l: 55 },
    secondary: { h: 220, s: 80, l: 60 },
    background: ['hsl(0, 0%, 0%)', 'hsl(210, 40%, 6%)', 'hsl(220, 30%, 4%)'],
  },
  3: { // Flow - Cosmic Purple
    primary: { h: 280, s: 90, l: 55 },
    secondary: { h: 300, s: 80, l: 60 },
    background: ['hsl(0, 0%, 0%)', 'hsl(280, 50%, 7%)', 'hsl(300, 35%, 4%)'],
  },
  4: { // Elite - Blazing Orange
    primary: { h: 25, s: 95, l: 55 },
    secondary: { h: 35, s: 90, l: 55 },
    background: ['hsl(0, 0%, 0%)', 'hsl(25, 60%, 8%)', 'hsl(35, 45%, 5%)'],
  },
  5: { // God Mode - Crimson Fire
    primary: { h: 0, s: 85, l: 55 },
    secondary: { h: 350, s: 90, l: 50 },
    background: ['hsl(0, 0%, 0%)', 'hsl(0, 70%, 8%)', 'hsl(350, 50%, 5%)'],
  },
};

// Phase modifiers (overlay effects on top of tier colors)
const PHASE_INTENSITY = {
  warmup: 0.6,
  ramping: 0.8,
  overdrive: 1.0,
};

export const HeatBackground = ({ gameSpeed, phase, tier = 1 }: HeatBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const phaseRef = useRef<AdaptivePhase>(phase);
  const speedRef = useRef<number>(gameSpeed);
  const tierRef = useRef<number>(tier);

  // Update refs for animation loop
  useEffect(() => {
    phaseRef.current = phase;
    speedRef.current = gameSpeed;
    tierRef.current = tier;
  }, [phase, gameSpeed, tier]);

  // Current colors based on tier
  const colors = useMemo(() => TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS[1], [tier]);
  const intensity = PHASE_INTENSITY[phase];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles - more particles for higher tiers
    const particleCount = 35 + (tier * 5);
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      radius: Math.random() * 2 + 1,
      connections: [],
    }));

    const animate = () => {
      const currentTier = tierRef.current;
      const currentSpeed = speedRef.current;
      const currentPhase = phaseRef.current;
      const tierColors = TIER_COLORS[currentTier as keyof typeof TIER_COLORS] || TIER_COLORS[1];
      const phaseIntensity = PHASE_INTENSITY[currentPhase];
      
      // Clear with gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      gradient.addColorStop(0, tierColors.background[1]);
      gradient.addColorStop(0.5, tierColors.background[2]);
      gradient.addColorStop(1, tierColors.background[0]);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const connectionDistance = 120 + (currentTier * 10);
      
      // Speed multiplier affects particle movement
      const speedMultiplier = 0.4 + currentSpeed * 0.6 * phaseIntensity;

      // Update and draw particles
      particles.forEach((p, i) => {
        // Move particles faster based on game speed and tier
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        // Bounce off edges
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        p.x = Math.max(0, Math.min(canvas.width, p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));

        // Draw connections
        particles.slice(i + 1).forEach((other) => {
          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.35 * phaseIntensity;
            const { h, s, l } = tierColors.primary;
            ctx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });

        // Draw particle with glow based on tier and phase
        const { h, s, l } = tierColors.secondary;
        const glowIntensity = (8 + currentTier * 4) * phaseIntensity;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * (1 + currentTier * 0.1), 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${0.7 + phaseIntensity * 0.2})`;
        ctx.shadowColor = `hsl(${h}, ${s}%, ${l + 10}%)`;
        ctx.shadowBlur = glowIntensity * currentSpeed;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Pulse effect for high tiers (4+) or overdrive
      if (currentTier >= 4 || currentPhase === 'overdrive') {
        const pulseSpeed = currentTier >= 5 ? 300 : 500;
        const pulseAlpha = 0.02 + Math.sin(Date.now() / pulseSpeed) * 0.03;
        const { h, s, l } = tierColors.primary;
        ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${pulseAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [tier]);

  // Background gradient overlay for smooth transitions
  const overlayStyle = useMemo(() => ({
    background: `radial-gradient(ellipse at center, ${colors.background[1]} 0%, ${colors.background[0]} 100%)`,
    transition: 'background 0.8s ease-in-out',
  }), [colors]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={overlayStyle}
      />
    </>
  );
};

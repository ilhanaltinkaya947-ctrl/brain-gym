import { useEffect, useRef, useMemo } from 'react';
import { AdaptivePhase } from '@/hooks/useAdaptiveEngine';
import { useIsMobile } from '@/hooks/use-mobile';

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
}

// Tier-based color palettes
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

// Simple CSS-only background for mobile
function MobileHeatBackground({ tier = 1 }: { tier: number }) {
  const colors = TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS[1];
  
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: `radial-gradient(ellipse at center, ${colors.background[1]} 0%, ${colors.background[2]} 50%, ${colors.background[0]} 100%)`,
        transition: 'background 0.5s ease-out',
      }}
    />
  );
}

// Desktop animated background
function DesktopHeatBackground({ gameSpeed, phase, tier = 1 }: HeatBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const phaseRef = useRef<AdaptivePhase>(phase);
  const speedRef = useRef<number>(gameSpeed);
  const tierRef = useRef<number>(tier);

  useEffect(() => {
    phaseRef.current = phase;
    speedRef.current = gameSpeed;
    tierRef.current = tier;
  }, [phase, gameSpeed, tier]);

  const colors = useMemo(() => TIER_COLORS[tier as keyof typeof TIER_COLORS] || TIER_COLORS[1], [tier]);

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

    // Reduced particle count for better performance
    const particleCount = 20;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: Math.random() * 2 + 1,
    }));

    // Cache gradient
    let cachedGradient: CanvasGradient | null = null;
    let lastTier = 0;

    const animate = () => {
      const currentTier = tierRef.current;
      const currentSpeed = speedRef.current;
      const tierColors = TIER_COLORS[currentTier as keyof typeof TIER_COLORS] || TIER_COLORS[1];
      
      // Rebuild gradient only if tier changed
      if (lastTier !== currentTier || !cachedGradient) {
        cachedGradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, canvas.width * 0.7
        );
        cachedGradient.addColorStop(0, tierColors.background[1]);
        cachedGradient.addColorStop(0.5, tierColors.background[2]);
        cachedGradient.addColorStop(1, tierColors.background[0]);
        lastTier = currentTier;
      }
      
      ctx.fillStyle = cachedGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const connectionDistance = 100;
      const speedMultiplier = 0.3 + currentSpeed * 0.4;

      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * speedMultiplier;
        p.y += p.vy * speedMultiplier;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        p.x = Math.max(0, Math.min(canvas.width, p.x));
        p.y = Math.max(0, Math.min(canvas.height, p.y));

        // Draw connections - simplified
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = other.x - p.x;
          const dy = other.y - p.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < connectionDistance * connectionDistance) {
            const dist = Math.sqrt(distSq);
            const alpha = (1 - dist / connectionDistance) * 0.2;
            const { h, s, l } = tierColors.primary;
            ctx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Draw particle - no shadow for performance
        const { h, s, l } = tierColors.secondary;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, 0.7)`;
        ctx.fill();
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

  const overlayStyle = useMemo(() => ({
    background: `radial-gradient(ellipse at center, ${colors.background[1]} 0%, ${colors.background[0]} 100%)`,
    transition: 'background 0.8s ease-in-out',
  }), [colors]);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30" style={overlayStyle} />
    </>
  );
}

export function HeatBackground({ gameSpeed, phase, tier = 1 }: HeatBackgroundProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return <MobileHeatBackground tier={tier} />;
  }
  return <DesktopHeatBackground gameSpeed={gameSpeed} phase={phase} tier={tier} />;
}

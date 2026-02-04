import { useEffect, useRef, useMemo } from 'react';
import { AdaptivePhase } from '@/hooks/useAdaptiveEngine';

interface HeatBackgroundProps {
  gameSpeed: number;
  phase: AdaptivePhase;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  connections: number[];
}

// Color palettes for each phase
const PHASE_COLORS = {
  warmup: {
    primary: { h: 175, s: 60, l: 50 }, // Teal
    secondary: { h: 180, s: 70, l: 45 }, // Cyan
    background: ['hsl(0, 0%, 0%)', 'hsl(180, 30%, 5%)', 'hsl(175, 20%, 3%)'],
  },
  ramping: {
    primary: { h: 280, s: 70, l: 55 }, // Purple
    secondary: { h: 330, s: 70, l: 60 }, // Magenta
    background: ['hsl(0, 0%, 0%)', 'hsl(280, 40%, 8%)', 'hsl(330, 30%, 5%)'],
  },
  overdrive: {
    primary: { h: 25, s: 90, l: 55 }, // Orange
    secondary: { h: 45, s: 90, l: 55 }, // Gold
    background: ['hsl(0, 0%, 0%)', 'hsl(25, 60%, 8%)', 'hsl(45, 40%, 5%)'],
  },
};

export const HeatBackground = ({ gameSpeed, phase }: HeatBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const phaseRef = useRef<AdaptivePhase>(phase);
  const speedRef = useRef<number>(gameSpeed);

  // Update refs for animation loop
  useEffect(() => {
    phaseRef.current = phase;
    speedRef.current = gameSpeed;
  }, [phase, gameSpeed]);

  // Current colors based on phase with smooth interpolation
  const colors = useMemo(() => PHASE_COLORS[phase], [phase]);

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

    // Initialize particles
    const particleCount = 40;
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        connections: [],
      }));
    }

    const animate = () => {
      const currentPhase = phaseRef.current;
      const currentSpeed = speedRef.current;
      const phaseColors = PHASE_COLORS[currentPhase];
      
      // Clear with gradient background
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.7
      );
      gradient.addColorStop(0, phaseColors.background[1]);
      gradient.addColorStop(0.5, phaseColors.background[2]);
      gradient.addColorStop(1, phaseColors.background[0]);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const connectionDistance = 150;
      
      // Speed multiplier affects particle movement
      const speedMultiplier = 0.5 + currentSpeed * 0.5;

      // Update and draw particles
      particles.forEach((p, i) => {
        // Move particles faster based on game speed
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
            const alpha = (1 - dist / connectionDistance) * 0.3;
            const { h, s, l } = phaseColors.primary;
            ctx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });

        // Draw particle with glow based on phase
        const { h, s, l } = phaseColors.secondary;
        const glowIntensity = currentPhase === 'overdrive' ? 20 : currentPhase === 'ramping' ? 12 : 8;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, 0.8)`;
        ctx.shadowColor = `hsl(${h}, ${s}%, ${l + 10}%)`;
        ctx.shadowBlur = glowIntensity * currentSpeed;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Pulse effect in overdrive
      if (currentPhase === 'overdrive') {
        const pulseAlpha = 0.03 + Math.sin(Date.now() / 500) * 0.02;
        const { h, s, l } = phaseColors.primary;
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
  }, []);

  // Background gradient overlay for smooth phase transitions
  const overlayStyle = useMemo(() => ({
    background: `radial-gradient(ellipse at center, ${colors.background[1]} 0%, ${colors.background[0]} 100%)`,
    transition: 'background 0.5s ease-in-out',
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

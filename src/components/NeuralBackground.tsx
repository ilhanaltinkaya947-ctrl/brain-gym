import { useEffect, useRef, memo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// Static CSS-only background for mobile - no JS animation
const MobileBackground = memo(() => (
  <div 
    className="fixed inset-0 pointer-events-none"
    style={{ 
      zIndex: -1,
      background: 'linear-gradient(180deg, hsl(270, 30%, 8%) 0%, hsl(260, 35%, 6%) 50%, hsl(250, 40%, 4%) 100%)',
    }}
  >
    {/* Static decorative dots - CSS only */}
    <div className="absolute inset-0 opacity-20">
      <div className="absolute w-1 h-1 bg-neon-cyan/50 rounded-full" style={{ top: '15%', left: '20%' }} />
      <div className="absolute w-1 h-1 bg-neon-cyan/40 rounded-full" style={{ top: '25%', left: '70%' }} />
      <div className="absolute w-1 h-1 bg-neon-cyan/30 rounded-full" style={{ top: '45%', left: '15%' }} />
      <div className="absolute w-1 h-1 bg-neon-cyan/50 rounded-full" style={{ top: '60%', left: '80%' }} />
      <div className="absolute w-1 h-1 bg-neon-cyan/40 rounded-full" style={{ top: '75%', left: '35%' }} />
      <div className="absolute w-1 h-1 bg-neon-cyan/30 rounded-full" style={{ top: '85%', left: '60%' }} />
    </div>
  </div>
));

MobileBackground.displayName = 'MobileBackground';

// Desktop canvas animation - reduced nodes for better performance
const DesktopBackground = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationRef = useRef<number>();

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

    // Reduced node count from 40 to 20 for better performance
    const nodeCount = 20;
    nodesRef.current = Array.from({ length: nodeCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
    }));

    // Cache gradient for reuse
    let cachedGradient: CanvasGradient | null = null;
    let lastHeight = 0;

    const animate = () => {
      if (!ctx || !canvas) return;

      // Reuse gradient if height hasn't changed
      if (lastHeight !== canvas.height) {
        cachedGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        cachedGradient.addColorStop(0, 'hsl(270, 30%, 8%)');
        cachedGradient.addColorStop(0.5, 'hsl(260, 35%, 6%)');
        cachedGradient.addColorStop(1, 'hsl(250, 40%, 4%)');
        lastHeight = canvas.height;
      }

      ctx.fillStyle = cachedGradient!;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const nodes = nodesRef.current;

      // Update node positions
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));
      }

      // Draw connections - reduced maxDistance
      const maxDistance = 120;
      ctx.lineWidth = 1;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxDistance * maxDistance) {
            const distance = Math.sqrt(distSq);
            const opacity = (1 - distance / maxDistance) * 0.12;
            ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes - simplified without glow gradient
      ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
      for (let i = 0; i < nodes.length; i++) {
        ctx.beginPath();
        ctx.arc(nodes[i].x, nodes[i].y, 2, 0, Math.PI * 2);
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
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
});

DesktopBackground.displayName = 'DesktopBackground';

export const NeuralBackground = memo(() => {
  const isMobile = useIsMobile();
  
  // Return static background on mobile, animated on desktop
  return isMobile ? <MobileBackground /> : <DesktopBackground />;
});

NeuralBackground.displayName = 'NeuralBackground';

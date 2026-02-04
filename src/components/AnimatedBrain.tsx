import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Neuron {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface Connection {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  delay: number;
}

export const AnimatedBrain = () => {
  const [neurons, setNeurons] = useState<Neuron[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  useEffect(() => {
    // Generate neurons positioned around a brain shape
    const brainNeurons: Neuron[] = [];
    const brainConnections: Connection[] = [];
    
    // Brain outline points (rough brain shape)
    const brainPoints = [
      { x: 50, y: 25 }, { x: 70, y: 20 }, { x: 85, y: 30 },
      { x: 90, y: 50 }, { x: 85, y: 70 }, { x: 70, y: 80 },
      { x: 50, y: 85 }, { x: 30, y: 80 }, { x: 15, y: 70 },
      { x: 10, y: 50 }, { x: 15, y: 30 }, { x: 30, y: 20 },
      // Inner neurons
      { x: 40, y: 40 }, { x: 60, y: 40 }, { x: 50, y: 55 },
      { x: 35, y: 60 }, { x: 65, y: 60 }, { x: 45, y: 70 },
      { x: 55, y: 70 }, { x: 50, y: 45 }, { x: 40, y: 50 },
      { x: 60, y: 50 }, { x: 30, y: 45 }, { x: 70, y: 45 },
    ];

    brainPoints.forEach((point, i) => {
      brainNeurons.push({
        id: i,
        x: point.x,
        y: point.y,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 2,
      });
    });

    // Generate connections between nearby neurons
    let connId = 0;
    for (let i = 0; i < brainNeurons.length; i++) {
      for (let j = i + 1; j < brainNeurons.length; j++) {
        const dx = brainNeurons[i].x - brainNeurons[j].x;
        const dy = brainNeurons[i].y - brainNeurons[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 25 && Math.random() > 0.3) {
          brainConnections.push({
            id: connId++,
            x1: brainNeurons[i].x,
            y1: brainNeurons[i].y,
            x2: brainNeurons[j].x,
            y2: brainNeurons[j].y,
            delay: Math.random() * 3,
          });
        }
      }
    }

    setNeurons(brainNeurons);
    setConnections(brainConnections);
  }, []);

  return (
    <div className="relative w-64 h-64">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        animate={{
          boxShadow: [
            '0 0 60px hsl(25 90% 55% / 0.2), 0 0 100px hsl(45 90% 55% / 0.1)',
            '0 0 80px hsl(25 90% 55% / 0.35), 0 0 140px hsl(45 90% 55% / 0.2)',
            '0 0 60px hsl(25 90% 55% / 0.2), 0 0 100px hsl(45 90% 55% / 0.1)',
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <svg 
        viewBox="0 0 100 100" 
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 0 10px hsl(25 90% 55% / 0.5))' }}
      >
        {/* Brain outline glow */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="neuronGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(25 90% 55%)" />
            <stop offset="100%" stopColor="hsl(45 90% 55%)" />
          </linearGradient>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(25 90% 55% / 0.6)" />
            <stop offset="100%" stopColor="hsl(45 90% 55% / 0.6)" />
          </linearGradient>
        </defs>

        {/* Connections with firing animation */}
        {connections.map((conn) => (
          <motion.line
            key={conn.id}
            x1={conn.x1}
            y1={conn.y1}
            x2={conn.x2}
            y2={conn.y2}
            stroke="url(#connectionGradient)"
            strokeWidth="0.5"
            filter="url(#glow)"
            initial={{ opacity: 0.2, pathLength: 0 }}
            animate={{ 
              opacity: [0.2, 0.8, 0.2],
              strokeWidth: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + Math.random(),
              repeat: Infinity,
              delay: conn.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Neurons with pulse animation */}
        {neurons.map((neuron) => (
          <motion.circle
            key={neuron.id}
            cx={neuron.x}
            cy={neuron.y}
            fill="url(#neuronGradient)"
            filter="url(#glow)"
            initial={{ r: neuron.size * 0.5 }}
            animate={{ 
              r: [neuron.size * 0.6, neuron.size * 1.2, neuron.size * 0.6],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.5 + Math.random(),
              repeat: Infinity,
              delay: neuron.delay,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Central pulse effect */}
        <motion.circle
          cx="50"
          cy="50"
          fill="none"
          stroke="url(#neuronGradient)"
          strokeWidth="0.5"
          initial={{ r: 20, opacity: 0.5 }}
          animate={{ 
            r: [20, 35, 20],
            opacity: [0.3, 0, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      </svg>

      {/* Inner brain shape silhouette */}
      <div className="absolute inset-8 pointer-events-none">
        <motion.div
          className="w-full h-full rounded-[40%_60%_60%_40%/60%_30%_70%_40%] bg-gradient-to-br from-bio-orange/10 to-bio-gold/5"
          animate={{
            scale: [1, 1.02, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
};

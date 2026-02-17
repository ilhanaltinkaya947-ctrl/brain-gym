import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Settings, Star, Flame, Trophy } from 'lucide-react';
import { NeuralCore } from './NeuralCore';

interface DashboardProps {
  onStartGame: () => void;
  onOpenSettings: () => void;
  brainCharge: number;
  totalXP: number;
  classicHighScore: number;
  endlessBestStreak: number;
}

// Stagger children pattern
const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 120, damping: 22 } },
};

export const Dashboard = ({
  onStartGame,
  onOpenSettings,
  brainCharge,
  totalXP,
  classicHighScore,
  endlessBestStreak,
}: DashboardProps) => {
  const formatNumber = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const readiness = Math.min(brainCharge > 0 ? brainCharge : 85, 50);

  // Responsive NeuralCore size
  const [coreSize, setCoreSize] = useState(240);
  useEffect(() => {
    const updateSize = () => {
      const h = window.innerHeight;
      if (h < 600) setCoreSize(150);
      else if (h < 750) setCoreSize(180);
      else if (h < 850) setCoreSize(210);
      else setCoreSize(240);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="min-h-screen-dynamic flex flex-col px-5 py-4 safe-all relative bg-background overflow-hidden"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex justify-end mb-4 z-10 pt-2">
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.85 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onClick={onOpenSettings}
          className="p-3 glass-panel rounded-full"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </motion.button>
      </motion.div>

      {/* Bento Grid */}
      <div className="flex-1 flex flex-col gap-5 z-10">
        {/* Hero Card */}
        <motion.div
          variants={fadeUp}
          className="flex-1 glass-panel rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden"
        >
          {/* Ambient glow */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              background: 'radial-gradient(circle at 50% 50%, hsl(var(--neon-cyan) / 0.15) 0%, transparent 60%)',
            }}
          />

          {/* Neural Core */}
          <motion.div
            className="relative z-10"
            animate={{ rotate: [0, 1, -1, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          >
            <NeuralCore size={coreSize} brainCharge={readiness} />
          </motion.div>
        </motion.div>

        {/* Metric Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Flame, value: endlessBestStreak, label: 'Streak', color: 'bio-orange', iconClass: 'text-bio-orange' },
            { icon: Star, value: totalXP, label: 'Total XP', color: 'neon-gold', iconClass: 'text-neon-gold fill-neon-gold/50', format: true },
            { icon: Trophy, value: classicHighScore, label: 'Best', color: 'bio-teal', iconClass: 'text-bio-teal', format: true },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              variants={fadeUp}
              whileTap={{ scale: 0.95 }}
              className="glass-panel rounded-2xl p-3 flex flex-col items-center justify-center relative overflow-hidden active:bg-white/10 transition-colors"
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-${metric.color}/10 to-transparent pointer-events-none`} />
              <metric.icon className={`w-4 h-4 ${metric.iconClass} mb-1.5`} />
              <span className="text-xl font-extralight text-foreground tabular-nums">
                {metric.format ? formatNumber(metric.value) : metric.value}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1 whitespace-nowrap">
                {metric.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA Button */}
      <motion.div variants={fadeUp} className="pt-4 pb-2 z-10">
        <motion.button
          whileHover={{ scale: 1.03, y: -3 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          onClick={onStartGame}
          className="w-full py-4 rounded-2xl bg-foreground text-background text-lg font-semibold tracking-wide flex items-center justify-center gap-3 relative overflow-hidden group"
          style={{
            boxShadow: '0 10px 40px -10px hsl(var(--foreground) / 0.3)',
          }}
        >
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-background/15 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
          />
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 5 }}
          >
            <Zap className="w-5 h-5" />
          </motion.div>
          Start Training
        </motion.button>
      </motion.div>

      {/* Ad Banner Placeholder */}
      <motion.div
        variants={fadeUp}
        className="mt-3 mb-2 h-[50px] w-full rounded-xl border border-dashed border-white/10 bg-white/[0.03] flex items-center justify-center z-10"
      >
        <span className="text-[10px] text-white/20 tracking-wider uppercase">Ad Space</span>
      </motion.div>
    </motion.div>
  );
};

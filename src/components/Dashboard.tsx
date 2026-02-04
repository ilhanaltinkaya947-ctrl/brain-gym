import { motion } from 'framer-motion';
import { Brain, Zap, Activity, TrendingUp, Target } from 'lucide-react';
import { ThreeRingChart } from './ThreeRingChart';
import { InsightCard } from './InsightCard';
import { MiniLineChart } from './MiniLineChart';

interface DashboardProps {
  onStartGame: () => void;
  onStartFlashMemory: () => void;
  brainCharge: number;
  highScore: number;
  flashHighScore: number;
  streak: number;
}

export const Dashboard = ({ onStartGame, onStartFlashMemory, brainCharge, highScore, flashHighScore, streak }: DashboardProps) => {
  // Calculate bio metrics
  const accuracy = Math.min(100, Math.round(brainCharge * 0.95 + Math.random() * 5));
  const speed = Math.min(100, Math.round(75 + (highScore / 100) * 20));
  const consistency = Math.min(100, streak * 10 + 40);
  
  // Simulated trend data
  const reactionTrend = [65, 70, 68, 75, 72, 78, 82, 80, 85];
  
  // Today's focus tips
  const focusTips = [
    "Try Direction Logic to improve response time",
    "Your accuracy peaks in the evening",
    "Speed Math boosts mental arithmetic",
    "Pattern Hunter sharpens visual processing",
  ];
  const todayTip = focusTips[Math.floor(Math.random() * focusTips.length)];

  return (
    <div className="min-h-screen flex flex-col items-center justify-between px-6 py-10 safe-top safe-bottom relative bg-background">
      {/* Header - Minimal, elegant */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Brain className="w-6 h-6 text-bio-teal" />
          <h1 className="text-2xl font-light tracking-wide">
            <span className="text-gradient-logic">Neuro</span>
            <span className="text-foreground font-extralight">Flow</span>
          </h1>
        </div>
        <p className="text-muted-foreground text-[10px] font-light uppercase tracking-[0.3em]">
          Neural Training System
        </p>
      </motion.div>

      {/* Three-Ring Chart - Hero Element */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 80 }}
        className="relative z-10 my-6"
      >
        <ThreeRingChart 
          accuracy={accuracy} 
          speed={speed} 
          streak={consistency} 
          brainScore={brainCharge} 
        />
        
        {/* Ring legend */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex justify-center gap-6 mt-6"
        >
          <div className="ring-label">
            <div className="ring-dot ring-dot-accuracy" />
            <span className="text-[10px] font-light text-muted-foreground tracking-wider">Accuracy</span>
          </div>
          <div className="ring-label">
            <div className="ring-dot ring-dot-speed" />
            <span className="text-[10px] font-light text-muted-foreground tracking-wider">Speed</span>
          </div>
          <div className="ring-label">
            <div className="ring-dot ring-dot-streak" />
            <span className="text-[10px] font-light text-muted-foreground tracking-wider">Streak</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Insight Cards */}
      <div className="w-full max-w-sm space-y-3 z-10">
        <div className="grid grid-cols-3 gap-3">
          <InsightCard title="Best" delay={0.4} icon={<Target className="w-3 h-3" />}>
            <p className="text-2xl font-semibold tracking-tight">{highScore.toLocaleString()}</p>
          </InsightCard>
          
          <InsightCard title="Flash" delay={0.5} icon={<Activity className="w-3 h-3" />}>
            <p className="text-2xl font-semibold tracking-tight">L{flashHighScore}</p>
          </InsightCard>
          
          <InsightCard title="Streak" delay={0.6} icon={<TrendingUp className="w-3 h-3" />}>
            <p className="text-2xl font-semibold tracking-tight">{streak}</p>
          </InsightCard>
        </div>

        {/* Reaction Trend Card */}
        <InsightCard title="Reaction Trend" delay={0.7}>
          <MiniLineChart data={reactionTrend} color="var(--bio-teal)" />
        </InsightCard>

        {/* Today's Focus Card */}
        <InsightCard title="Today's Focus" delay={0.8}>
          <p className="text-sm text-foreground/80 font-light leading-relaxed">{todayTip}</p>
        </InsightCard>
      </div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="w-full max-w-sm space-y-3 z-10 mt-6"
      >
        {/* Primary Start Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartGame}
          className="w-full py-5 rounded-2xl btn-primary-glow text-lg font-medium tracking-wide flex items-center justify-center gap-3"
        >
          <Zap className="w-5 h-5" />
          Start Training
        </motion.button>

        {/* Secondary Flash Memory Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onStartFlashMemory}
          className="w-full py-4 rounded-xl btn-secondary-glow text-base font-light tracking-wide flex items-center justify-center gap-3"
        >
          <Activity className="w-4 h-4" />
          Flash Memory
        </motion.button>
      </motion.div>
    </div>
  );
};

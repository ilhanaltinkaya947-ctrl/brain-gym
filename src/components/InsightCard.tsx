import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface InsightCardProps {
  title: string;
  children: ReactNode;
  delay?: number;
  icon?: ReactNode;
}

export const InsightCard = ({ title, children, delay = 0, icon }: InsightCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="card-smoked rounded-2xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <h3 className="text-xs font-light uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </motion.div>
  );
};

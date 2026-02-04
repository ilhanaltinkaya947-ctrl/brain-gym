import { motion } from 'framer-motion';

interface MiniLineChartProps {
  data: number[];
  color?: string;
}

export const MiniLineChart = ({ data, color = 'var(--bio-teal)' }: MiniLineChartProps) => {
  const width = 200;
  const height = 40;
  const padding = 4;
  
  const maxVal = Math.max(...data, 1);
  const minVal = Math.min(...data, 0);
  const range = maxVal - minVal || 1;
  
  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - minVal) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const pathD = `M ${points.split(' ').join(' L ')}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Gradient fill under line */}
      <defs>
        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={`hsl(${color})`} stopOpacity="0.3" />
          <stop offset="100%" stopColor={`hsl(${color})`} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke={`hsl(${color})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
      
      {/* End dot */}
      {data.length > 0 && (
        <motion.circle
          cx={padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2)}
          cy={height - padding - ((data[data.length - 1] - minVal) / range) * (height - padding * 2)}
          r="4"
          fill={`hsl(${color})`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.3, duration: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px hsl(${color} / 0.6))` }}
        />
      )}
    </svg>
  );
};

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import api from '../api/client';

interface TrendPoint {
  date: string;
  score: number;
}

export default function MiniTrendChart() {
  const navigate = useNavigate();
  const [points, setPoints] = useState<TrendPoint[]>([]);

  useEffect(() => {
    api
      .get<{ scoreTrend: TrendPoint[] }>('/stats/trends?period=week')
      .then((res) => setPoints(res.data.scoreTrend))
      .catch(() => {});
  }, []);

  if (points.length < 2) return null;

  const max = Math.max(...points.map((p) => p.score), 1);
  const min = Math.min(...points.map((p) => p.score), 0);
  const range = max - min || 1;

  const width = 200;
  const height = 48;
  const padding = 4;

  const pathPoints = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - ((p.score - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const d = pathPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaD = `${d} L ${pathPoints[pathPoints.length - 1].x} ${height} L ${pathPoints[0].x} ${height} Z`;

  const lastScore = points[points.length - 1]?.score ?? 0;
  const prevScore = points[points.length - 2]?.score ?? lastScore;
  const diff = lastScore - prevScore;

  return (
    <motion.button
      onClick={() => navigate('/trends')}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
      whileTap={{ scale: 0.98 }}
      className="w-full rounded-2xl border border-gray-200/60 bg-white/80 p-4 text-left backdrop-blur-sm transition-colors hover:border-primary-200 hover:bg-white dark:border-gray-700/60 dark:bg-gray-800/60 dark:hover:border-primary-700 dark:hover:bg-gray-800"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-primary-500" />
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">本周趋势</span>
        </div>
        <span
          className={`text-xs font-semibold ${
            diff >= 0 ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {diff >= 0 ? '+' : ''}
          {diff}
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-12 w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#miniGrad)" />
        <path d={d} fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pathPoints[pathPoints.length - 1].x} cy={pathPoints[pathPoints.length - 1].y} r="3" fill="#4CAF50" />
      </svg>
    </motion.button>
  );
}

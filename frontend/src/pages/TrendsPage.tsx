import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendingUp, Calendar, Activity, Award } from 'lucide-react';
import api from '../api/client';

interface TrendsData {
  period: string;
  totalRecords: number;
  avgScore: number;
  daysWithRecords: number;
  frequency: number;
  scoreTrend: { date: string; score: number }[];
  bristolDistribution: { name: string; value: number }[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const BRISTOL_COLORS = [
  '#EF4444', '#F97316', '#84CC16', '#4CAF50', '#06B6D4', '#8B5CF6', '#EC4899',
];

export default function TrendsPage() {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/stats/trends?period=${period}`).then((res) => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [period]);

  return (
    <motion.div
      className="mx-auto max-w-lg px-4 py-6 lg:max-w-3xl lg:px-8 lg:py-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">趋势报告</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">查看你的健康变化趋势</p>
      </motion.div>

      {/* Period switcher */}
      <motion.div variants={fadeUp} className="mb-6 flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
        {(['week', 'month'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              period === p ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {period === p && (
              <motion.div
                layoutId="period-tab"
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-gray-700"
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              />
            )}
            <span className="relative">{p === 'week' ? '本周' : '本月'}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
            <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
            <div className="h-64 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          </motion.div>
        ) : !data || data.totalRecords === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-dashed border-gray-300 py-16 text-center dark:border-gray-700"
          >
            <Activity size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
            <p className="text-sm text-gray-400 dark:text-gray-500">暂无数据</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              开始记录后这里会显示你的健康趋势
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={period}
            variants={stagger}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
          >
            {/* Stats overview */}
            <motion.div variants={fadeUp} className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard icon={Award} label="平均评分" value={data.avgScore} color="text-primary-500" />
              <StatCard icon={Activity} label="记录次数" value={data.totalRecords} color="text-blue-500" />
              <StatCard icon={Calendar} label="活跃天数" value={data.daysWithRecords} color="text-amber-500" />
              <StatCard icon={TrendingUp} label="日均频率" value={data.frequency} color="text-emerald-500" />
            </motion.div>

            {/* Score trend chart */}
            <motion.div variants={fadeUp} className="mb-5 rounded-2xl border border-gray-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
              <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">评分趋势</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.scoreTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#4CAF50" />
                        <stop offset="100%" stopColor="#2E7D32" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      tickFormatter={(v) => v.slice(5)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 10, fill: '#9CA3AF' }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid #E5E7EB',
                        background: 'white',
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="url(#lineGradient)"
                      strokeWidth={3}
                      dot={{ fill: '#4CAF50', r: 4 }}
                      activeDot={{ r: 6, fill: '#2E7D32' }}
                      animationDuration={1200}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Bristol distribution */}
            <motion.div variants={fadeUp} className="rounded-2xl border border-gray-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
              <h3 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">Bristol 分布</h3>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <div className="h-48 w-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.bristolDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        animationDuration={1000}
                      >
                        {data.bristolDistribution.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={BRISTOL_COLORS[parseInt(entry.name.split(' ')[1]) - 1] || '#9CA3AF'}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid #E5E7EB',
                          background: 'white',
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5">
                  {data.bristolDistribution.map((entry, i) => (
                    <motion.div
                      key={entry.name}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{
                            background:
                              BRISTOL_COLORS[parseInt(entry.name.split(' ')[1]) - 1] || '#9CA3AF',
                          }}
                        />
                        <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{entry.value} 次</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/70 p-3 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/70">
      <Icon size={16} className={`mb-1.5 ${color}`} />
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, Droplets, Activity, Utensils, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';
import MiniTrendChart from '../components/MiniTrendChart';
import AlmanacCard from '../components/AlmanacCard';

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

interface RecordItem {
  id: string;
  bristolType: number;
  symptoms?: string[];
  createdAt: string;
  healthScore?: { score: number; advice: string };
}

function getScoreColor(score: number) {
  if (score >= 80) return { text: 'text-green-600', gradient: 'from-green-400 to-emerald-500' };
  if (score >= 60) return { text: 'text-amber-600', gradient: 'from-amber-400 to-orange-500' };
  return { text: 'text-red-600', gradient: 'from-red-400 to-rose-500' };
}

function getScoreLabel(score: number) {
  if (score >= 80) return '状态良好';
  if (score >= 60) return '基本正常';
  if (score >= 40) return '需要关注';
  return '建议就医';
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);
  const time = d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (days === 0) return `今天 ${time}`;
  if (days === 1) return `昨天 ${time}`;
  if (days === 2) return `前天 ${time}`;
  return `${d.getMonth() + 1}/${d.getDate()} ${time}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayFood, setTodayFood] = useState<{ tags: string[] } | null>(null);

  useEffect(() => {
    api.get('/records?limit=14').then((res) => {
      setRecords(res.data.records);
      setLoading(false);
    }).catch(() => setLoading(false));
    api
      .get('/food/today')
      .then((res) => {
        if (res.data && typeof res.data === 'object' && 'tags' in res.data) {
          setTodayFood({ tags: (res.data as any).tags });
        }
      })
      .catch(() => {});
  }, []);

  const latestScore = records[0]?.healthScore?.score;
  const avgScore = records.length > 0
    ? Math.round(records.reduce((sum, r) => sum + (r.healthScore?.score || 0), 0) / records.length)
    : 0;

  const greeting = new Date().getHours() < 12 ? '早上好' : new Date().getHours() < 18 ? '下午好' : '晚上好';

  return (
    <motion.div
      className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting} {user?.nickname}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">今天的肠道状态如何？</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 shadow-lg shadow-primary-500/20">
          <span className="text-sm font-bold text-white">
            {user?.nickname?.charAt(0) || 'U'}
          </span>
        </div>
      </motion.div>

      {/* Today's Almanac */}
      <motion.div variants={fadeUp} className="mb-6">
        <AlmanacCard records={records} />
      </motion.div>

      {/* Diet quick log */}
      <motion.button
        variants={fadeUp}
        onClick={() => navigate('/diet')}
        whileTap={{ scale: 0.98 }}
        className="mb-6 flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3.5 text-left shadow-sm dark:border-amber-900/40 dark:from-amber-900/20 dark:to-orange-900/20"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-orange-500/30">
            <Utensils size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {todayFood ? '今日饮食已记录' : '今天吃了啥？'}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {todayFood
                ? `已标记 ${todayFood.tags.length} 项，可补充或查看洞察`
                : '记下饮食标签，发现"嫌疑食物"'}
            </p>
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
      </motion.button>

      {/* Health Status Card */}
      <motion.div variants={fadeUp} className="relative mb-6 overflow-hidden rounded-3xl p-[1px]">
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-primary-400 via-emerald-400 to-teal-400 opacity-80" />
        <motion.div
          className="absolute inset-0 rounded-3xl bg-gradient-to-r from-teal-400 via-primary-400 to-emerald-400 opacity-80"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: 'center' }}
        />
        <div className="relative rounded-3xl bg-white/90 p-6 backdrop-blur-sm dark:bg-gray-900/90">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {latestScore ? '最近健康评分' : '暂无记录'}
              </p>
              {latestScore ? (
                <>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-primary-600 dark:text-primary-400">{latestScore}</span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">/100</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-green-500" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {getScoreLabel(latestScore)}
                    </span>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">点击 + 开始第一次记录</p>
              )}
            </div>
            {latestScore && (
              <div className="relative">
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="30" fill="none" stroke="#E5E7EB" strokeWidth="6" />
                  <motion.circle
                    cx="36" cy="36" r="30" fill="none"
                    stroke="url(#scoreGradient)" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 30}
                    initial={{ strokeDashoffset: 2 * Math.PI * 30 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 30 * (1 - latestScore / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                    transform="rotate(-90 36 36)"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4CAF50" />
                      <stop offset="100%" stopColor="#2E7D32" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity size={20} className="text-primary-500" />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div variants={fadeUp} className="mb-6 grid grid-cols-3 gap-3">
        {[
          { icon: Droplets, label: '总记录', value: String(records.length), color: 'text-blue-500' },
          { icon: Activity, label: '平均评分', value: avgScore > 0 ? String(avgScore) : '-', color: 'text-primary-500' },
          { icon: TrendingUp, label: '趋势', value: records.length > 1 ? '↑' : '-', color: 'text-green-500' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-gray-200/60 bg-white/70 p-3 text-center backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/70">
            <stat.icon size={18} className={`mx-auto mb-1 ${stat.color}`} />
            <p className="text-lg font-bold text-gray-800 dark:text-gray-100">{stat.value}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Mini Trend Chart */}
      <motion.div variants={fadeUp} className="mb-6">
        <MiniTrendChart />
      </motion.div>

      {/* Recent Records */}
      <motion.div variants={fadeUp}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">最近记录</h2>
          {records.length > 0 && (
            <button
              onClick={() => navigate('/history')}
              className="text-xs font-medium text-primary-600 dark:text-primary-400"
            >
              查看全部
            </button>
          )}
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
            <p className="text-sm text-gray-400 dark:text-gray-500">还没有记录</p>
            <button
              onClick={() => navigate('/record')}
              className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400"
            >
              开始第一次记录
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {records.slice(0, 5).map((record, i) => {
              const score = record.healthScore?.score || 0;
              const colors = getScoreColor(score);
              return (
                <motion.div
                  key={record.id}
                  onClick={() => navigate(`/records/${record.id}`)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
                  className="flex cursor-pointer items-center gap-4 rounded-2xl border border-gray-200/60 bg-white/70 p-4 backdrop-blur-sm transition-colors hover:border-primary-200 hover:bg-white dark:border-gray-700/60 dark:bg-gray-800/70 dark:hover:border-primary-700 dark:hover:bg-gray-800"
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colors.gradient} shadow-sm`}>
                    <span className="text-sm font-bold text-white">{score}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">Bristol Type {record.bristolType}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatTime(record.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-medium ${colors.text}`}>
                    {getScoreLabel(score)}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* FAB */}
      <motion.button
        onClick={() => navigate('/record')}
        className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 shadow-xl shadow-primary-500/40 lg:bottom-8 lg:right-8"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
      >
        <Plus size={24} className="text-white" />
        <motion.div
          className="absolute inset-0 rounded-full bg-primary-400"
          animate={{ scale: [1, 1.4, 1.4], opacity: [0.4, 0, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      </motion.button>
    </motion.div>
  );
}

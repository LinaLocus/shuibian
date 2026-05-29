import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Heart, TrendingDown, TrendingUp, Activity } from 'lucide-react';
import api from '../api/client';
import { tagIcon, tagLabel } from '../features/food/tags';
import { suspiciousQuote, friendlyQuote, neutralQuote } from '../features/food/quotes';

interface TagStat {
  tag: string;
  occurrences: number;
  avgScoreSameDay: number | null;
  avgScoreNextDay: number | null;
  baselineAvg: number;
  delta: number;
}

interface Insight {
  totalDays: number;
  baselineAvg: number | null;
  suspicious: TagStat[];
  friendly: TagStat[];
  neutral: TagStat[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function DietInsightsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(60);

  useEffect(() => {
    setLoading(true);
    api
      .get<Insight>(`/food/insights?days=${days}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [days]);

  const hasAny =
    data && (data.suspicious.length > 0 || data.friendly.length > 0 || data.neutral.length > 0);

  return (
    <motion.div
      className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">饮食洞察</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">寻找肠胃的盟友与对头</p>
        </div>
      </motion.div>

      {/* Range tabs */}
      <motion.div variants={fadeUp} className="mb-5 flex gap-2">
        {[
          { v: 30, l: '近 30 天' },
          { v: 60, l: '近 60 天' },
          { v: 90, l: '近 90 天' },
        ].map((opt) => (
          <button
            key={opt.v}
            onClick={() => setDays(opt.v)}
            className={`flex-1 rounded-xl py-2 text-xs font-medium transition-colors ${
              days === opt.v
                ? 'bg-primary-500 text-white shadow'
                : 'bg-white/80 text-gray-600 dark:bg-gray-800/80 dark:text-gray-300'
            }`}
          >
            {opt.l}
          </button>
        ))}
      </motion.div>

      {/* Baseline */}
      {data && data.baselineAvg != null && (
        <motion.div
          variants={fadeUp}
          className="mb-5 flex items-center justify-between rounded-2xl border border-gray-200/60 bg-white/80 px-4 py-3 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80"
        >
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">基线平均分</p>
              <p className="font-serif text-lg font-bold text-gray-800 dark:text-gray-100">
                {data.baselineAvg}
              </p>
            </div>
          </div>
          <p className="text-right text-xs text-gray-400 dark:text-gray-500">
            共记录{data.totalDays}日
          </p>
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </div>
      ) : !data || !hasAny ? (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-dashed border-gray-300 py-14 text-center dark:border-gray-700"
        >
          <p className="font-serif text-sm text-gray-500 dark:text-gray-400">
            证据不足，难下结论
          </p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            至少需 7-10 日的饮食与排便记录，方能洞察规律
          </p>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {/* Suspicious */}
          {data.suspicious.length > 0 && (
            <motion.section variants={fadeUp}>
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-500" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  嫌疑食物
                </h2>
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                  {data.suspicious.length}
                </span>
              </div>
              <div className="space-y-2">
                {data.suspicious.map((s) => (
                  <InsightCard key={s.tag} stat={s} variant="suspicious" />
                ))}
              </div>
            </motion.section>
          )}

          {/* Friendly */}
          {data.friendly.length > 0 && (
            <motion.section variants={fadeUp}>
              <div className="mb-2 flex items-center gap-2">
                <Heart size={16} className="text-primary-500" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  挚友食物
                </h2>
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {data.friendly.length}
                </span>
              </div>
              <div className="space-y-2">
                {data.friendly.map((s) => (
                  <InsightCard key={s.tag} stat={s} variant="friendly" />
                ))}
              </div>
            </motion.section>
          )}

          {/* Neutral */}
          {data.neutral.length > 0 && (
            <motion.section variants={fadeUp}>
              <div className="mb-2 flex items-center gap-2">
                <Activity size={16} className="text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  寻常食物
                </h2>
              </div>
              <div className="space-y-2">
                {data.neutral.map((s) => (
                  <InsightCard key={s.tag} stat={s} variant="neutral" />
                ))}
              </div>
            </motion.section>
          )}

          {/* Disclaimer */}
          <motion.p
            variants={fadeUp}
            className="px-2 text-center text-[11px] leading-relaxed text-gray-400 dark:text-gray-500"
          >
            * 相关性不等于因果性。本洞察仅供参考，不构成医学建议
          </motion.p>
        </div>
      )}
    </motion.div>
  );
}

function InsightCard({
  stat,
  variant,
}: {
  stat: TagStat;
  variant: 'suspicious' | 'friendly' | 'neutral';
}) {
  const label = tagLabel(stat.tag);
  const quote =
    variant === 'suspicious'
      ? suspiciousQuote(stat, label)
      : variant === 'friendly'
      ? friendlyQuote(stat, label)
      : neutralQuote(stat, label);

  const style =
    variant === 'suspicious'
      ? 'border-rose-200/60 bg-rose-50/60 dark:border-rose-900/40 dark:bg-rose-900/10'
      : variant === 'friendly'
      ? 'border-primary-200/60 bg-primary-50/60 dark:border-primary-900/40 dark:bg-primary-900/10'
      : 'border-gray-200/60 bg-white/80 dark:border-gray-700/60 dark:bg-gray-800/80';

  const Trend = variant === 'suspicious' ? TrendingDown : variant === 'friendly' ? TrendingUp : Activity;
  const trendColor =
    variant === 'suspicious'
      ? 'text-rose-500'
      : variant === 'friendly'
      ? 'text-primary-500'
      : 'text-gray-400';

  return (
    <div className={`rounded-2xl border p-3.5 backdrop-blur-sm ${style}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{tagIcon(stat.tag)}</span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{label}</span>
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${trendColor}`}>
          <Trend size={13} />
          <span>
            {stat.delta > 0 ? '+' : ''}
            {stat.delta} 分
          </span>
        </div>
      </div>
      <p className="font-serif text-sm italic leading-relaxed text-gray-700 dark:text-gray-200">
        {quote}
      </p>
      <div className="mt-2 flex gap-3 text-[11px] text-gray-500 dark:text-gray-400">
        <span>当日均分 {stat.avgScoreSameDay ?? '—'}</span>
        <span>次日均分 {stat.avgScoreNextDay ?? '—'}</span>
        <span>基线 {stat.baselineAvg}</span>
      </div>
    </div>
  );
}

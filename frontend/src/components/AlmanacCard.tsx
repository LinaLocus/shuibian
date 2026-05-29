import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { getAlmanac } from '../features/dashboard/almanac';

interface RecordItem {
  bristolType: number;
  healthScore?: { score: number } | null;
  symptoms?: string[];
  createdAt: string;
}

const FORTUNE_STYLE: Record<
  string,
  { ring: string; badge: string; glow: string }
> = {
  great: {
    ring: 'from-amber-300 via-yellow-300 to-orange-300',
    badge: 'bg-amber-500 text-white',
    glow: 'shadow-amber-300/40',
  },
  good: {
    ring: 'from-primary-300 via-emerald-300 to-teal-300',
    badge: 'bg-primary-500 text-white',
    glow: 'shadow-primary-400/40',
  },
  normal: {
    ring: 'from-sky-200 via-cyan-200 to-blue-200',
    badge: 'bg-sky-500 text-white',
    glow: 'shadow-sky-300/40',
  },
  caution: {
    ring: 'from-orange-200 via-amber-200 to-yellow-200',
    badge: 'bg-orange-500 text-white',
    glow: 'shadow-orange-300/40',
  },
  rest: {
    ring: 'from-rose-200 via-pink-200 to-red-200',
    badge: 'bg-rose-500 text-white',
    glow: 'shadow-rose-300/40',
  },
};

export default function AlmanacCard({ records }: { records: RecordItem[] }) {
  const almanac = useMemo(() => getAlmanac({ records }), [records]);
  const style = FORTUNE_STYLE[almanac.fortune];

  const today = new Date();
  const dateLabel = `${today.getMonth() + 1} 月 ${today.getDate()} 日`;
  const weekday = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()];

  return (
    <div className={`relative overflow-hidden rounded-3xl p-[1px] shadow-lg ${style.glow}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${style.ring} opacity-90`} />
      <motion.div
        className={`absolute inset-0 bg-gradient-to-tr ${style.ring} opacity-70`}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <div className="relative rounded-3xl bg-white/95 p-5 backdrop-blur-sm dark:bg-gray-900/95">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-serif text-xs tracking-widest text-gray-500 dark:text-gray-400">
              今日黄历
            </p>
            <p className="mt-0.5 font-serif text-base font-semibold text-gray-800 dark:text-gray-100">
              {dateLabel} · 星期{weekday}
            </p>
          </div>
          <motion.div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${style.badge} shadow-lg`}
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          >
            <span className="font-serif text-xl font-bold">{almanac.fortuneLabel}</span>
          </motion.div>
        </div>

        {/* Fortune text */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-4 flex items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-2 dark:bg-gray-800/60"
        >
          <Sparkles size={13} className="flex-shrink-0 text-amber-500" />
          <p className="font-serif text-sm italic text-gray-700 dark:text-gray-200">
            {almanac.fortuneText}
          </p>
        </motion.div>

        {/* 宜 / 忌 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-primary-100 font-serif text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                宜
              </span>
              <span className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Auspicious
              </span>
            </div>
            <ul className="space-y-1">
              {almanac.good.map((g, i) => (
                <motion.li
                  key={g}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="font-serif text-sm text-gray-700 dark:text-gray-200"
                >
                  {g}
                </motion.li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-100 font-serif text-xs font-bold text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                忌
              </span>
              <span className="text-[11px] uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Avoid
              </span>
            </div>
            <ul className="space-y-1">
              {almanac.bad.map((b, i) => (
                <motion.li
                  key={b}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.05 }}
                  className="font-serif text-sm text-gray-700 dark:text-gray-200"
                >
                  {b}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

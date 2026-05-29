import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getQuote } from '../quotes';
import type { RecordFormData } from '../RecordFlow';

interface Props {
  score: {
    score: number;
    advice: string;
    factors: Record<string, number>;
  } | null;
  onReset?: () => void;
  formData?: RecordFormData;
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FF9800';
  if (score >= 40) return '#FF5722';
  return '#F44336';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return '状态良好';
  if (score >= 60) return '基本正常';
  if (score >= 40) return '需要关注';
  return '建议就医';
}

export default function ScoreReveal({ score, onReset, formData }: Props) {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  const quote = useMemo(
    () =>
      score
        ? getQuote({
            score: score.score,
            bristolType: formData?.bristolType,
            effort: formData?.effort,
            symptoms: formData?.symptoms,
          })
        : '',
    [score, formData],
  );

  useEffect(() => {
    if (!score) return;
    let start = 0;
    const end = score.score;
    const duration = 1500;
    const stepTime = duration / end;

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  if (!score) return null;

  const color = getScoreColor(score.score);
  const circumference = 2 * Math.PI * 54;
  const progress = (count / 100) * circumference;

  return (
    <div className="flex flex-col items-center py-4">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
        className="relative mb-6"
      >
        <svg width="140" height="140" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
            className="dark:stroke-gray-700"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            transform="rotate(-90 60 60)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - progress }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-4xl font-bold"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {count}
          </motion.span>
          <span className="text-xs text-gray-500 dark:text-gray-400">分</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-3 text-lg font-semibold"
        style={{ color }}
      >
        {getScoreLabel(score.score)}
      </motion.div>

      {quote && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9, type: 'spring', stiffness: 200, damping: 18 }}
          className="relative mb-5 max-w-xs px-6"
        >
          <span
            className="absolute -left-1 -top-2 select-none font-serif text-3xl leading-none text-primary-300/70 dark:text-primary-700/70"
            aria-hidden
          >
            “
          </span>
          <p className="text-center font-serif text-base italic leading-relaxed text-gray-700 dark:text-gray-200">
            {quote}
          </p>
          <span
            className="absolute -right-1 -bottom-4 select-none font-serif text-3xl leading-none text-primary-300/70 dark:text-primary-700/70"
            aria-hidden
          >
            ”
          </span>
        </motion.div>
      )}

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="mb-6 max-w-xs text-center text-sm text-gray-600 dark:text-gray-300"
      >
        {score.advice}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="w-full rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800"
      >
        <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">评分明细</h3>
        <div className="space-y-2">
          {Object.entries(score.factors).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="w-16 text-xs text-gray-500 dark:text-gray-400">
                {factorLabel(key)}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: getScoreColor(value as number) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ delay: 1.4, duration: 0.6, ease: 'easeOut' }}
                />
              </div>
              <span className="w-8 text-right text-xs font-medium text-gray-600 dark:text-gray-300">
                {value as number}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="mt-6 flex w-full gap-3"
      >
        <motion.button
          onClick={onReset}
          className="flex-1 rounded-2xl border-2 border-gray-200 py-3 font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
          whileTap={{ scale: 0.97 }}
        >
          再记一次
        </motion.button>
        <motion.button
          onClick={() => navigate('/')}
          className="flex-[2] rounded-2xl bg-primary-500 py-3 font-medium text-white shadow-lg shadow-primary-500/30"
          whileTap={{ scale: 0.97 }}
        >
          返回首页
        </motion.button>
      </motion.div>
    </div>
  );
}

function factorLabel(key: string): string {
  const map: Record<string, string> = {
    bristol: 'Bristol',
    color: '颜色',
    comfort: '舒适度',
    effort: '用力',
    symptoms: '症状',
  };
  return map[key] || key;
}

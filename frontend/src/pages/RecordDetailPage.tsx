import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trash2,
  Clock,
  Droplets,
  Activity,
  AlertCircle,
  Gauge,
  Ruler,
} from 'lucide-react';
import api from '../api/client';

interface RecordDetail {
  id: string;
  mode: string;
  bristolType: number;
  color: string;
  duration: number;
  effort: string;
  comfort: number;
  amount: string | null;
  symptoms: string[] | null;
  notes: string | null;
  createdAt: string;
  healthScore?: {
    score: number;
    advice: string;
    factors: Record<string, number>;
  };
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const COLOR_LABELS: Record<string, string> = {
  brown: '棕色',
  dark_brown: '深棕色',
  yellow: '黄色',
  green: '绿色',
  black: '黑色',
  red: '红色',
  pale: '浅色',
};

const EFFORT_LABELS: Record<string, string> = {
  easy: '轻松',
  moderate: '适中',
  hard: '费力',
};

const AMOUNT_LABELS: Record<string, string> = {
  small: '少量',
  moderate: '适中',
  large: '大量',
};

function getScoreColor(score: number) {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
}

function getScoreGradient(score: number) {
  if (score >= 80) return 'from-emerald-400 to-green-600';
  if (score >= 60) return 'from-amber-400 to-orange-500';
  return 'from-red-400 to-rose-600';
}

function getScoreLabel(score: number) {
  if (score >= 80) return '状态良好';
  if (score >= 60) return '基本正常';
  if (score >= 40) return '需要关注';
  return '建议就医';
}

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<RecordDetail>(`/records/${id}`)
      .then((res) => setRecord(res.data))
      .catch(() => navigate('/', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!record || deleting) return;
    if (!confirm('确定删除这条记录吗？删除后不可恢复。')) return;
    setDeleting(true);
    try {
      await api.delete(`/records/${record.id}`);
      navigate('/', { replace: true });
    } catch {
      alert('删除失败');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10">
        <div className="mb-4 h-8 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mb-6 h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-60 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  if (!record) return null;

  const score = record.healthScore?.score ?? 0;
  const createdAt = new Date(record.createdAt);

  return (
    <motion.div
      className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">记录详情</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {createdAt.toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            {createdAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          aria-label="删除记录"
        >
          <Trash2 size={18} />
        </button>
      </motion.div>

      {/* Score card */}
      {record.healthScore && (
        <motion.div
          variants={fadeUp}
          className={`relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br ${getScoreGradient(score)} p-6 text-white shadow-lg`}
        >
          <motion.div
            className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm text-white/80">健康评分</p>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-5xl font-bold">{score}</span>
                <span className="text-lg text-white/70">/100</span>
              </div>
              <p className="mt-2 text-sm font-medium text-white/90">
                {getScoreLabel(score)}
              </p>
            </div>
            <div className="relative">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                <motion.circle
                  cx="40" cy="40" r="34" fill="none"
                  stroke="white" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 34}
                  initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - score / 100) }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity size={22} className="text-white/80" />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Advice */}
      {record.healthScore?.advice && (
        <motion.div
          variants={fadeUp}
          className="mb-5 rounded-2xl border border-primary-200/60 bg-primary-50/50 p-4 backdrop-blur-sm dark:border-primary-800/60 dark:bg-primary-900/20"
        >
          <div className="mb-2 flex items-center gap-2">
            <AlertCircle size={16} className="text-primary-600 dark:text-primary-400" />
            <p className="text-sm font-semibold text-primary-700 dark:text-primary-300">健康建议</p>
          </div>
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {record.healthScore.advice}
          </p>
        </motion.div>
      )}

      {/* Details grid */}
      <motion.div variants={fadeUp} className="mb-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">详细信息</h2>
        <div className="grid grid-cols-2 gap-3">
          <InfoCard
            icon={Activity}
            label="Bristol 类型"
            value={`Type ${record.bristolType}`}
            color="text-primary-500"
          />
          <InfoCard
            icon={Droplets}
            label="颜色"
            value={COLOR_LABELS[record.color] || record.color}
            color="text-blue-500"
          />
          <InfoCard
            icon={Clock}
            label="时长"
            value={`${record.duration} 分钟`}
            color="text-amber-500"
          />
          <InfoCard
            icon={Gauge}
            label="用力程度"
            value={EFFORT_LABELS[record.effort] || record.effort}
            color="text-orange-500"
          />
          <InfoCard
            icon={Ruler}
            label="舒适度"
            value={`${record.comfort}/5`}
            color="text-purple-500"
          />
          {record.amount && (
            <InfoCard
              icon={Droplets}
              label="量"
              value={AMOUNT_LABELS[record.amount] || record.amount}
              color="text-teal-500"
            />
          )}
        </div>
      </motion.div>

      {/* Symptoms */}
      {record.symptoms && record.symptoms.length > 0 && (
        <motion.div variants={fadeUp} className="mb-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">伴随症状</h2>
          <div className="flex flex-wrap gap-2">
            {record.symptoms.map((s) => (
              <span
                key={s}
                className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300"
              >
                {s}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Notes */}
      {record.notes && (
        <motion.div variants={fadeUp} className="mb-5">
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">备注</h2>
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
            <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{record.notes}</p>
          </div>
        </motion.div>
      )}

      {/* Score factors */}
      {record.healthScore?.factors && (
        <motion.div variants={fadeUp}>
          <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">评分因素</h2>
          <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
            {Object.entries(record.healthScore.factors).map(([key, val], i, arr) => (
              <div
                key={key}
                className={`flex items-center justify-between px-4 py-3 ${
                  i < arr.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                }`}
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">{key}</span>
                <span className={`text-sm font-semibold ${getScoreColor(val as number)}`}>
                  {val as number}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200/60 bg-white/70 p-3 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/70">
      <Icon size={16} className={`mb-1.5 ${color}`} />
      <p className="text-sm font-bold text-gray-800 dark:text-gray-100">{value}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

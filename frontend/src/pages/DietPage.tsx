import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Sparkles, Utensils, Calendar } from 'lucide-react';
import api from '../api/client';
import { FOOD_TAGS, tagIcon, tagLabel } from '../features/food/tags';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

interface FoodLog {
  id: string;
  date: string;
  tags: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(date: string) {
  const d = new Date(date + 'T00:00:00');
  const now = new Date();
  const diff = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - d.getTime()) /
      (86400 * 1000),
  );
  if (diff === 0) return '今天';
  if (diff === 1) return '昨天';
  if (diff === 2) return '前天';
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function DietPage() {
  const navigate = useNavigate();
  const [today, setToday] = useState<FoodLog | null>(null);
  const [history, setHistory] = useState<FoodLog[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(true);

  const todayKeyStr = useMemo(() => todayKey(), []);

  const load = async () => {
    setLoading(true);
    const to = todayKeyStr;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-${String(fromDate.getDate()).padStart(2, '0')}`;
    try {
      const [t, h] = await Promise.all([
        api.get<FoodLog | ''>('/food/today'),
        api.get<FoodLog[]>(`/food?from=${from}&to=${to}`),
      ]);
      const todayLog = t.data && (t.data as any).id ? (t.data as FoodLog) : null;
      setToday(todayLog);
      setSelectedTags(todayLog?.tags || []);
      setNotes(todayLog?.notes || '');
      setHistory((h.data || []).filter((x) => x.date !== todayKeyStr));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = (id: string) => {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await api.put<FoodLog>(`/food/${todayKeyStr}`, {
        tags: selectedTags,
        notes: notes.trim(),
      });
      setToday(res.data);
      setToast(today ? '已更新' : '已记录');
      setTimeout(() => setToast(''), 1500);
    } catch {
      setToast('保存失败');
      setTimeout(() => setToast(''), 1500);
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    today == null
      ? selectedTags.length > 0 || notes.trim().length > 0
      : selectedTags.join(',') !== today.tags.join(',') ||
        (notes.trim() || '') !== (today.notes || '');

  return (
    <motion.div
      className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-xl bg-primary-500 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp} className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">饮食日志</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">记下吃了啥，找出嫌疑食物</p>
        </div>
        <button
          onClick={() => navigate('/diet/insights')}
          className="flex items-center gap-1 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 px-3 py-2 text-xs font-medium text-orange-700 shadow-sm transition-transform active:scale-95 dark:from-amber-900/30 dark:to-orange-900/30 dark:text-orange-300"
        >
          <Sparkles size={14} />
          饮食洞察
        </button>
      </motion.div>

      {/* Today's record */}
      <motion.div variants={fadeUp} className="mb-5">
        <div className="mb-3 flex items-center gap-2">
          <Utensils size={16} className="text-primary-600 dark:text-primary-400" />
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">今日饮食</p>
          {today && (
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
              已记录
            </span>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
          <div className="grid grid-cols-4 gap-2">
            {FOOD_TAGS.map((t) => {
              const active = selectedTags.includes(t.id);
              return (
                <motion.button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  whileTap={{ scale: 0.92 }}
                  className={`relative flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-xs transition-colors ${
                    active
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                      : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  <span className="text-lg">{t.icon}</span>
                  <span className="font-medium">{t.label}</span>
                  {active && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-500 text-white">
                      <Check size={10} />
                    </span>
                  )}
                </motion.button>
              );
            })}
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="备注：今天吃了啥具体的？例如「红酱意粉+咖啡」"
            rows={2}
            maxLength={500}
            className="mt-4 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition-colors focus:border-primary-400 focus:bg-white dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:focus:bg-gray-600"
          />

          <motion.button
            onClick={save}
            disabled={!isDirty || saving}
            whileTap={{ scale: 0.98 }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 disabled:opacity-40"
          >
            {saving ? (
              <motion.div
                className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              />
            ) : today ? (
              '更新今日记录'
            ) : (
              '记录今日饮食'
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* History */}
      <motion.div variants={fadeUp}>
        <div className="mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-gray-600 dark:text-gray-400" />
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">最近 30 天</p>
        </div>
        {loading ? (
          <div className="h-20 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
            <p className="text-sm text-gray-400 dark:text-gray-500">还没有历史记录</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">坚持记录几天就能看到洞察</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.03 }}
                className="rounded-xl border border-gray-200/60 bg-white/80 p-3 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80"
              >
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {formatDateLabel(h.date)}
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {h.tags.length} 项
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {h.tags.length === 0 ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500">无标签</span>
                  ) : (
                    h.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-0.5 rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      >
                        <span>{tagIcon(t)}</span>
                        {tagLabel(t)}
                      </span>
                    ))
                  )}
                </div>
                {h.notes && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{h.notes}</p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, Activity } from 'lucide-react';
import api from '../api/client';

interface RecordItem {
  id: string;
  bristolType: number;
  createdAt: string;
  healthScore?: { score: number; advice: string };
}

interface GroupedRecords {
  date: string;
  label: string;
  records: RecordItem[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

function getScoreColor(score: number) {
  if (score >= 80) return { text: 'text-emerald-600', bg: 'from-emerald-400 to-green-600' };
  if (score >= 60) return { text: 'text-amber-600', bg: 'from-amber-400 to-orange-500' };
  return { text: 'text-red-500', bg: 'from-red-400 to-rose-600' };
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  if (dateStr === today) return '今天';
  if (dateStr === yesterday) return '昨天';
  return d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
}

function groupByDate(records: RecordItem[]): GroupedRecords[] {
  const map = new Map<string, RecordItem[]>();
  for (const r of records) {
    const date = r.createdAt.slice(0, 10);
    if (!map.has(date)) map.set(date, []);
    map.get(date)!.push(r);
  }
  return Array.from(map.entries()).map(([date, records]) => ({
    date,
    label: formatDateLabel(date),
    records,
  }));
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<number | null>(null);
  const limit = 30;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ records: RecordItem[]; total: number }>(
        `/records?page=${page}&limit=${limit}`,
      );
      setRecords(res.data.records);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter
    ? records.filter((r) => r.bristolType === filter)
    : records;
  const grouped = groupByDate(filtered);
  const totalPages = Math.ceil(total / limit);

  return (
    <motion.div
      className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">历史记录</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">共 {total} 条记录</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400 dark:text-gray-500" />
        </div>
      </motion.div>

      {/* Bristol filter */}
      <motion.div variants={fadeUp} className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter(null)}
          className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === null
              ? 'bg-primary-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          全部
        </button>
        {[1, 2, 3, 4, 5, 6, 7].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(filter === type ? null : type)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === type
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            Type {type}
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
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
            ))}
          </motion.div>
        ) : grouped.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-dashed border-gray-300 py-14 text-center dark:border-gray-700"
          >
            <Activity size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filter ? '没有该类型的记录' : '还没有记录'}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`page-${page}-${filter}`}
            variants={stagger}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {grouped.map((group) => (
              <motion.div key={group.date} variants={fadeUp}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{group.label}</span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {group.records.length} 条
                  </span>
                </div>
                <div className="space-y-2">
                  {group.records.map((record, i) => {
                    const score = record.healthScore?.score || 0;
                    const colors = getScoreColor(score);
                    const time = new Date(record.createdAt).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    return (
                      <motion.button
                        key={record.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => navigate(`/records/${record.id}`)}
                        whileTap={{ scale: 0.98 }}
                        className="flex w-full items-center gap-3 rounded-2xl border border-gray-200/60 bg-white/80 p-3.5 text-left backdrop-blur-sm transition-colors hover:border-primary-200 hover:bg-white dark:border-gray-700/60 dark:bg-gray-800/80 dark:hover:border-primary-700 dark:hover:bg-gray-800"
                      >
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colors.bg} shadow-sm`}
                        >
                          <span className="text-xs font-bold text-white">{score}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            Bristol Type {record.bristolType}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
                        </div>
                        <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {totalPages > 1 && (
        <motion.div variants={fadeUp} className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            上一页
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            下一页
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

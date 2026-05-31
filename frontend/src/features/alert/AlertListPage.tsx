import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCheck } from 'lucide-react';
import AlertCard from './AlertCard';
import { AlertItem, fetchAlerts, markAllRead } from './alertApi';

export default function AlertListPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [tab, setTab] = useState<'unread' | 'all'>('unread');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchAlerts({ unread: tab === 'unread', limit: 50 });
      setAlerts(res.alerts);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [tab]);

  const handleRead = (id: string) => {
    setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, readAt: new Date().toISOString() } : a));
  };

  const handleReadAll = async () => {
    await markAllRead();
    setAlerts((prev) => prev.map((a) => ({ ...a, readAt: a.readAt || new Date().toISOString() })));
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-gray-700 dark:text-gray-300" />
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">告警通知</h1>
        </div>
        {tab === 'unread' && alerts.length > 0 && (
          <button
            onClick={handleReadAll}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            <CheckCheck size={14} /> 全部已读
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {(['unread', 'all'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
            }`}
          >
            {t === 'unread' ? '未读' : '全部'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : alerts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center"
        >
          <Bell size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {tab === 'unread' ? '没有未读告警' : '暂无告警记录'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <AlertCard key={a.id} alert={a} onRead={handleRead} />
          ))}
        </div>
      )}
    </div>
  );
}
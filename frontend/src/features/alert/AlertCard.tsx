import { motion } from 'framer-motion';
import { AlertTriangle, TrendingDown, Activity } from 'lucide-react';
import { AlertItem, markRead } from './alertApi';

const severityConfig = {
  danger: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: AlertTriangle, iconColor: 'text-red-500' },
  warn: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', icon: TrendingDown, iconColor: 'text-orange-500' },
  info: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: Activity, iconColor: 'text-blue-500' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}

interface Props {
  alert: AlertItem;
  onRead?: (id: string) => void;
}

export default function AlertCard({ alert, onRead }: Props) {
  const config = severityConfig[alert.severity];
  const Icon = config.icon;
  const isRead = !!alert.readAt;

  const handleRead = async () => {
    if (isRead) return;
    await markRead(alert.id);
    onRead?.(alert.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 ${config.bg} ${config.border} ${isRead ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${config.iconColor}`}>
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{alert.title}</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{alert.summary}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400">{timeAgo(alert.createdAt)}</span>
            {!isRead && (
              <button
                onClick={handleRead}
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                标为已读
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

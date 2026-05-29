import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bell } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const options = [
  { key: 'daily', label: '每日提醒', desc: '每天提醒你记录排便情况' },
  { key: 'weekly', label: '健康周报', desc: '每周发送健康趋势总结' },
  { key: 'family', label: '家庭动态', desc: '家庭成员新记录通知' },
];

export default function NotificationSettingsPage() {
  const navigate = useNavigate();
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    daily: false,
    weekly: false,
    family: false,
  });
  const [toast, setToast] = useState('');

  const handleToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    setToast('功能开发中，敬请期待');
    setTimeout(() => setToast(''), 2000);
    setTimeout(() => setToggles((prev) => ({ ...prev, [key]: !prev[key] })), 300);
  };

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
            className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-xl bg-gray-800 px-4 py-3 text-center text-sm font-medium text-white shadow-lg dark:bg-gray-700"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">通知设置</h1>
      </motion.div>

      <motion.div variants={fadeUp} className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
        {options.map((opt, i) => (
          <div
            key={opt.key}
            className={`flex items-center justify-between px-5 py-4 ${
              i < options.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                <Bell size={16} className="text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle(opt.key)}
              className={`relative h-7 w-12 rounded-full transition-colors ${
                toggles[opt.key] ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <motion.div
                className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow"
                animate={{ left: toggles[opt.key] ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
            </button>
          </div>
        ))}
      </motion.div>

      <motion.p variants={fadeUp} className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
        推送通知功能正在开发中
      </motion.p>
    </motion.div>
  );
}

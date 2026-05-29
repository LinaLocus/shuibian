import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/client';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

interface PrivacySettings {
  showScoreToFamily: boolean;
  showDetailsToFamily: boolean;
  showNotesToFamily: boolean;
}

const DEFAULTS: PrivacySettings = {
  showScoreToFamily: true,
  showDetailsToFamily: true,
  showNotesToFamily: false,
};

export default function PrivacySettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    ...DEFAULTS,
    ...(user?.privacy || {}),
  });
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState<keyof PrivacySettings | null>(null);

  const toggle = async (key: keyof PrivacySettings) => {
    if (saving) return;
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    setSaving(key);
    try {
      const res = await api.patch('/auth/me', { privacy: { [key]: updated[key] } });
      updateUser({ privacy: res.data.privacy });
      setToast('已保存');
    } catch {
      setSettings(settings);
      setToast('保存失败');
    } finally {
      setSaving(null);
      setTimeout(() => setToast(''), 1500);
    }
  };

  const options = [
    { key: 'showScoreToFamily' as const, label: '健康评分', desc: '家庭成员可以看到我的评分', icon: settings.showScoreToFamily ? Eye : EyeOff },
    { key: 'showDetailsToFamily' as const, label: '记录详情', desc: '家庭成员可以看到 Bristol 类型等详情', icon: settings.showDetailsToFamily ? Eye : EyeOff },
    { key: 'showNotesToFamily' as const, label: '备注内容', desc: '家庭成员可以看到我的备注', icon: settings.showNotesToFamily ? Eye : EyeOff },
  ];

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

      <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">隐私设置</h1>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-4 rounded-2xl border border-primary-200/60 bg-primary-50/50 p-4 backdrop-blur-sm dark:border-primary-800/60 dark:bg-primary-900/20">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-primary-600 dark:text-primary-400" />
          <p className="text-sm font-medium text-primary-700 dark:text-primary-300">家庭数据可见性</p>
        </div>
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          控制家庭成员在家庭动态中能看到你的哪些信息
        </p>
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
                <opt.icon size={16} className="text-gray-600 dark:text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
              </div>
            </div>
            <button
              onClick={() => toggle(opt.key)}
              disabled={saving !== null}
              className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-60 ${
                settings[opt.key] ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <motion.div
                className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow"
                animate={{ left: settings[opt.key] ? 22 : 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              />
            </button>
          </div>
        ))}
      </motion.div>

      <motion.p variants={fadeUp} className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
        设置已同步到云端，家庭动态会立即生效
      </motion.p>
    </motion.div>
  );
}

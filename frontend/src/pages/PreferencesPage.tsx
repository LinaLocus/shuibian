import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Globe, Ruler } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const STORAGE_KEY = 'preferences';

interface Preferences {
  unit: 'metric' | 'imperial';
  language: 'zh' | 'en';
}

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { unit: 'metric', language: 'zh' };
}

function savePrefs(p: Preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export default function PreferencesPage() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Preferences>(loadPrefs);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1500);
  };

  const setUnit = (unit: 'metric' | 'imperial') => {
    const updated = { ...prefs, unit };
    setPrefs(updated);
    savePrefs(updated);
    showToast('已保存');
  };

  const setLanguage = (language: 'zh' | 'en') => {
    const updated = { ...prefs, language };
    setPrefs(updated);
    savePrefs(updated);
    if (language === 'en') {
      showToast('English support coming soon');
    } else {
      showToast('已保存');
    }
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">偏好设置</h1>
      </motion.div>

      {/* Unit system */}
      <motion.div variants={fadeUp} className="mb-4 overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
        <div className="mb-3 flex items-center gap-2">
          <Ruler size={16} className="text-gray-600 dark:text-gray-400" />
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">单位制</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'metric' as const, label: '公制', desc: '厘米、千克' },
            { value: 'imperial' as const, label: '英制', desc: '英寸、磅' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setUnit(opt.value)}
              className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                prefs.unit === opt.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              }`}
            >
              <p className={`text-sm font-medium ${
                prefs.unit === opt.value
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>{opt.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Language */}
      <motion.div variants={fadeUp} className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
        <div className="mb-3 flex items-center gap-2">
          <Globe size={16} className="text-gray-600 dark:text-gray-400" />
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">语言</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'zh' as const, label: '中文', desc: '简体中文' },
            { value: 'en' as const, label: 'English', desc: 'Coming soon' },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setLanguage(opt.value)}
              className={`rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                prefs.language === opt.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              }`}
            >
              <p className={`text-sm font-medium ${
                prefs.language === opt.value
                  ? 'text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300'
              }`}>{opt.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.p variants={fadeUp} className="mt-4 text-center text-xs text-gray-400 dark:text-gray-500">
        偏好设置保存在本地
      </motion.p>
    </motion.div>
  );
}

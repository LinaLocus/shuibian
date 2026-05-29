import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, User as UserIcon, Settings, Bell, Shield, ChevronRight, Sun, Moon, Monitor, Download } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import api from '../api/client';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await api.get('/records/export', { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shuibian-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div
      className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">我的</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">管理账户与偏好</p>
      </motion.div>

      {/* Profile card */}
      <motion.div
        variants={fadeUp}
        className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white shadow-lg shadow-primary-500/20"
      >
        <motion.div
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-12 -left-4 h-24 w-24 rounded-full bg-white/10"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <span className="text-2xl font-bold">
              {user?.nickname?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold">{user?.nickname}</h2>
            <p className="text-sm text-white/80">{user?.email}</p>
          </div>
        </div>
      </motion.div>

      {/* Theme switcher */}
      <motion.div variants={fadeUp} className="mb-4 overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 p-4 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
        <p className="mb-3 text-sm font-medium text-gray-800 dark:text-gray-200">外观模式</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'light', icon: Sun, label: '浅色' },
            { value: 'dark', icon: Moon, label: '深色' },
            { value: 'system', icon: Monitor, label: '跟随系统' },
          ] as const).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center gap-1.5 rounded-xl py-3 text-xs font-medium transition-colors ${
                theme === opt.value
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50'
              }`}
            >
              <opt.icon size={18} />
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Settings list */}
      <motion.div variants={fadeUp} className="mb-4 overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
        {[
          { icon: UserIcon, label: '个人信息', desc: '修改昵称', onClick: () => navigate('/profile/edit') },
          { icon: Bell, label: '通知设置', desc: '提醒、推送', onClick: () => navigate('/profile/notifications') },
          { icon: Download, label: '导出数据', desc: exporting ? '导出中...' : '导出所有记录', onClick: handleExport },
          { icon: Shield, label: '隐私设置', desc: '数据可见性', onClick: () => navigate('/profile/privacy') },
          { icon: Settings, label: '偏好设置', desc: '单位、语言', onClick: () => navigate('/profile/preferences') },
        ].map((item, i, arr) => (
          <motion.button
            key={item.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className={`flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
              i < arr.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
            }`}
            whileTap={{ scale: 0.98 }}
            onClick={item.onClick}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
              <item.icon size={18} className="text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{item.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
            <ChevronRight size={18} className="text-gray-400" />
          </motion.button>
        ))}
      </motion.div>

      {/* Logout button */}
      <motion.button
        variants={fadeUp}
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white/80 py-3.5 text-sm font-medium text-red-600 backdrop-blur-sm hover:bg-red-50 dark:border-red-800/60 dark:bg-gray-800/80 dark:text-red-400 dark:hover:bg-red-900/20"
        whileTap={{ scale: 0.97 }}
      >
        <LogOut size={18} />
        退出登录
      </motion.button>

      <motion.p
        variants={fadeUp}
        className="mt-6 text-center text-xs text-gray-400"
      >
        谁便 v0.1.0
      </motion.p>
    </motion.div>
  );
}

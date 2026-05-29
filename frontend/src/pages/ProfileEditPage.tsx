import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
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

export default function ProfileEditPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError('昵称不能为空');
      return;
    }
    if (trimmed === user?.nickname) {
      navigate(-1);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await api.patch('/auth/me', { nickname: trimmed });
      updateUser({ nickname: res.data.nickname });
      setSuccess(true);
      setTimeout(() => navigate(-1), 800);
    } catch (err: any) {
      setError(err.response?.data?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">个人信息</h1>
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-2xl border border-gray-200/60 bg-white/80 p-5 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          昵称
        </label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => { setNickname(e.target.value); setError(''); }}
          maxLength={20}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary-400 focus:bg-white dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-primary-500 dark:focus:bg-gray-800"
          placeholder="输入新昵称"
        />
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 text-xs text-red-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <div className="mt-4 text-xs text-gray-400 dark:text-gray-500">
          <p>邮箱：{user?.email}</p>
          <p className="mt-1">邮箱暂不支持修改</p>
        </div>
      </motion.div>

      <motion.button
        variants={fadeUp}
        onClick={handleSave}
        disabled={saving || success}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-500 py-3.5 text-sm font-medium text-white shadow-lg shadow-primary-500/30 disabled:opacity-60"
        whileTap={saving ? undefined : { scale: 0.97 }}
      >
        {success ? (
          <>
            <Check size={18} />
            已保存
          </>
        ) : saving ? (
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          '保存'
        )}
      </motion.button>
    </motion.div>
  );
}

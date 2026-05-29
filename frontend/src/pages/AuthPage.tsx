import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';
import api from '../api/client';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sending, setSending] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = async () => {
    setError('');
    if (!email) { setError('请先填写邮箱'); return; }
    setSending(true);
    try {
      await api.post('/auth/send-code', { email });
      setCodeSent(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || '发送失败，请稍后再试');
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password, nickname, code);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || '操作失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError('');
    setCodeSent(false);
    setCode('');
    setCountdown(0);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-white to-green-50/30 px-4 dark:from-gray-950 dark:via-gray-900 dark:to-green-950/20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 text-center">
          <motion.div
            className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-xl shadow-primary-500/30"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
          >
            <span className="text-2xl font-bold text-white">S</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">谁便</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">排便健康记录与分析</p>
        </div>

        {/* Tab Switch */}
        <div className="mb-6 flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
          {['登录', '注册'].map((tab, i) => (
            <button
              key={tab}
              onClick={() => switchMode(i === 0)}
              className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                (i === 0) === isLogin ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {(i === 0) === isLogin && (
                <motion.div
                  layoutId="auth-tab"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-gray-700"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <span className="relative">{tab}</span>
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                key="register-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="space-y-4 overflow-hidden"
              >
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">昵称</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="你的昵称"
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="your@email.com"
              required
            />
          </div>

          {/* Verification code (register only) */}
          <AnimatePresence>
            {!isLogin && (
              <motion.div
                key="code-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="overflow-hidden"
              >
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">验证码</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-mono text-lg tracking-widest outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    placeholder="------"
                    maxLength={6}
                    required={!isLogin}
                  />
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={sending || countdown > 0}
                    className="flex-shrink-0 rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    {sending ? (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-gray-700" />
                    ) : countdown > 0 ? (
                      `${countdown}s`
                    ) : codeSent ? (
                      '重新发送'
                    ) : (
                      '发送验证码'
                    )}
                  </button>
                </div>
                {codeSent && countdown > 0 && (
                  <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    验证码已发至 {email}，5 分钟内有效
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">密码</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-11 text-sm outline-none transition-all focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="至少 6 位"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 py-3.5 text-sm font-medium text-white shadow-lg shadow-primary-500/30 disabled:opacity-60"
            whileTap={{ scale: 0.97 }}
          >
            {submitting ? (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : isLogin ? '登录' : '完成注册'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

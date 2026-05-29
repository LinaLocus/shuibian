import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  UserPlus,
  ChevronRight,
  Crown,
  Copy,
  RefreshCw,
  LogOut,
  X,
  Check,
  Activity,
  ArrowLeft,
  Trash2,
  MessageCircle,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import ChatPanel from '../components/ChatPanel';

interface FamilySummary {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
  myRole: 'admin' | 'member';
  createdAt: string;
}

interface FamilyMember {
  id: string;
  userId: string;
  nickname: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
  joinedAt: string;
  isMe: boolean;
}

interface FamilyDetail {
  id: string;
  name: string;
  inviteCode: string;
  myRole: 'admin' | 'member';
  members: FamilyMember[];
}

interface FeedItem {
  id: string;
  userId: string;
  nickname: string;
  bristolType: number | null;
  score: number | null;
  notes?: string | null;
  createdAt: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function scoreColor(score: number | null) {
  if (score == null) return 'text-gray-400';
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  return 'text-red-500';
}

export default function FamilyPage() {
  const [families, setFamilies] = useState<FamilySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'none' | 'create' | 'join'>('none');

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await api.get<FamilySummary[]>('/family');
      setFamilies(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {selectedId ? (
          <motion.div
            key={`detail-${selectedId}`}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ type: 'spring', stiffness: 220, damping: 26 }}
          >
            <FamilyDetailView
              familyId={selectedId}
              onBack={() => setSelectedId(null)}
              onLeft={() => {
                setSelectedId(null);
                loadList();
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <ListView
              families={families}
              loading={loading}
              onSelect={setSelectedId}
              onCreate={() => setModalMode('create')}
              onJoin={() => setModalMode('join')}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalMode !== 'none' && (
          <ActionModal
            mode={modalMode}
            onClose={() => setModalMode('none')}
            onSuccess={() => {
              setModalMode('none');
              loadList();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───── List view ─────────────────────────────────────────── */

function ListView({
  families,
  loading,
  onSelect,
  onCreate,
  onJoin,
}: {
  families: FamilySummary[];
  loading: boolean;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onJoin: () => void;
}) {
  return (
    <motion.div
      className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={fadeUp} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">家庭</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">与家人共享健康记录</p>
      </motion.div>

      <motion.div variants={fadeUp} className="mb-6 grid grid-cols-2 gap-3">
        <button
          onClick={onCreate}
          className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 p-5 text-white shadow-lg shadow-primary-500/20 transition-transform active:scale-95"
        >
          <motion.div
            className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/10"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Plus size={20} />
          </div>
          <span className="relative text-sm font-medium">创建家庭</span>
        </button>
        <button
          onClick={onJoin}
          className="group relative flex flex-col items-center gap-2 overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 p-5 text-gray-700 backdrop-blur-sm transition-transform active:scale-95 dark:border-gray-700/60 dark:bg-gray-800/80 dark:text-gray-200"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
            <UserPlus size={20} />
          </div>
          <span className="text-sm font-medium">加入家庭</span>
        </button>
      </motion.div>

      {loading ? (
        <motion.div variants={fadeUp} className="space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          <div className="h-24 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </motion.div>
      ) : families.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-dashed border-gray-300 py-14 text-center dark:border-gray-700"
        >
          <Users size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
          <p className="text-sm text-gray-500 dark:text-gray-400">还没有加入任何家庭</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">创建一个或使用邀请码加入</p>
        </motion.div>
      ) : (
        <motion.div variants={stagger} className="space-y-3">
          {families.map((f) => (
            <motion.button
              key={f.id}
              variants={fadeUp}
              onClick={() => onSelect(f.id)}
              whileTap={{ scale: 0.98 }}
              className="group flex w-full items-center gap-4 rounded-2xl border border-gray-200/60 bg-white/80 p-4 text-left backdrop-blur-sm transition-colors hover:border-primary-200 hover:bg-white dark:border-gray-700/60 dark:bg-gray-800/80 dark:hover:border-primary-700 dark:hover:bg-gray-800"
            >
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-600 dark:from-primary-900/40 dark:to-primary-900/20 dark:text-primary-300">
                <Users size={22} />
                {f.myRole === 'admin' && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-white shadow">
                    <Crown size={11} />
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{f.name}</p>
                  {f.myRole === 'admin' && (
                    <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      管理员
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {f.memberCount} 位成员 · 邀请码 {f.inviteCode}
                </p>
              </div>
              <ChevronRight
                size={18}
                className="text-gray-400 transition-transform group-hover:translate-x-0.5 dark:text-gray-500"
              />
            </motion.button>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ───── Detail view ───────────────────────────────────────── */

function FamilyDetailView({
  familyId,
  onBack,
  onLeft,
}: {
  familyId: string;
  onBack: () => void;
  onLeft: () => void;
}) {
  const { user } = useAuth();
  const [detail, setDetail] = useState<FamilyDetail | null>(null);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [tab, setTab] = useState<'feed' | 'chat'>('feed');

  const load = async () => {
    setLoading(true);
    try {
      const [d, f] = await Promise.all([
        api.get<FamilyDetail>(`/family/${familyId}`),
        api.get<FeedItem[]>(`/family/${familyId}/feed`),
      ]);
      setDetail(d.data);
      setFeed(f.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [familyId]);

  const copyCode = async () => {
    if (!detail) return;
    try {
      await navigator.clipboard.writeText(detail.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const regenerate = async () => {
    if (!detail || regenerating) return;
    if (!confirm('重置后旧邀请码立即失效，确定吗？')) return;
    setRegenerating(true);
    try {
      const res = await api.post<{ inviteCode: string }>(
        `/family/${familyId}/regenerate-code`,
      );
      setDetail({ ...detail, inviteCode: res.data.inviteCode });
    } finally {
      setRegenerating(false);
    }
  };

  const leave = async () => {
    if (!detail) return;
    const isLast = detail.members.length === 1;
    const msg = isLast
      ? '你是唯一成员，离开后家庭将被解散，确定吗？'
      : '确定离开此家庭吗？';
    if (!confirm(msg)) return;
    await api.delete(`/family/${familyId}/leave`);
    onLeft();
  };

  const removeMember = async (m: FamilyMember) => {
    if (!confirm(`将 ${m.nickname} 移出家庭？`)) return;
    try {
      await api.delete(`/family/${familyId}/members/${m.id}`);
      load();
    } catch {
      alert('移除失败');
    }
  };

  if (loading || !detail) {
    return (
      <div className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10">
        <div className="mb-4 h-8 w-32 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        <div className="mb-6 h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        <div className="h-48 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <motion.div
      className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="mb-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/80 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{detail.name}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">{detail.members.length} 位成员</p>
        </div>
      </motion.div>

      {/* Invite code card */}
      <motion.div
        variants={fadeUp}
        className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 p-5 text-white shadow-lg shadow-primary-500/20"
      >
        <motion.div
          className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative">
          <p className="mb-1 text-xs uppercase tracking-wider text-white/70">邀请码</p>
          <div className="flex items-center gap-3">
            <p className="font-mono text-3xl font-bold tracking-widest">
              {detail.inviteCode}
            </p>
            <button
              onClick={copyCode}
              className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
              aria-label="复制邀请码"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                  >
                    <Check size={16} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy size={16} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
            {detail.myRole === 'admin' && (
              <button
                onClick={regenerate}
                disabled={regenerating}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30 disabled:opacity-50"
                aria-label="重置邀请码"
              >
                <motion.div
                  animate={regenerating ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    regenerating
                      ? { duration: 0.8, repeat: Infinity, ease: 'linear' }
                      : { duration: 0.3 }
                  }
                >
                  <RefreshCw size={16} />
                </motion.div>
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-white/70">分享给家人加入此家庭</p>
        </div>
      </motion.div>

      {/* Members */}
      <motion.div variants={fadeUp} className="mb-5">
        <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">成员</h2>
        <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80">
          {detail.members.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.04 }}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < detail.members.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
              }`}
            >
              <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 dark:from-primary-900/40 dark:to-primary-900/20 dark:text-primary-300">
                <span className="text-sm font-bold">
                  {m.nickname.charAt(0).toUpperCase()}
                </span>
                {m.role === 'admin' && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-white shadow">
                    <Crown size={9} />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                    {m.nickname}
                  </p>
                  {m.isMe && (
                    <span className="rounded bg-primary-50 px-1.5 py-0.5 text-[11px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      我
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{m.email}</p>
              </div>
              {detail.myRole === 'admin' && !m.isMe && (
                <button
                  onClick={() => removeMember(m)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  aria-label="移除成员"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Feed / Chat tabs */}
      <motion.div variants={fadeUp} className="mb-3 flex gap-1 rounded-xl bg-gray-100/80 p-1 backdrop-blur-sm dark:bg-gray-800/80">
        {([
          { key: 'feed' as const, label: '家庭动态', icon: Activity },
          { key: 'chat' as const, label: '家庭聊天', icon: MessageCircle },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-colors ${
              tab === t.key
                ? 'text-primary-700 dark:text-primary-300'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {tab === t.key && (
              <motion.div
                layoutId="family-tab"
                className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-gray-700"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <t.icon size={13} />
              {t.label}
            </span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        {tab === 'feed' ? (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mb-6"
          >
            {feed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 py-10 text-center dark:border-gray-700">
                <Activity
                  size={32}
                  className="mx-auto mb-2 text-gray-300 dark:text-gray-600"
                  strokeWidth={1.5}
                />
                <p className="text-xs text-gray-400 dark:text-gray-500">还没有家庭成员的记录</p>
              </div>
            ) : (
              <div className="space-y-2">
                {feed.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 rounded-xl border border-gray-200/60 bg-white/80 p-3 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-50 text-xs font-bold text-primary-700 dark:from-primary-900/40 dark:to-primary-900/20 dark:text-primary-300">
                      {item.nickname.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                          {item.nickname}
                          {item.userId === user?.id && (
                            <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">（我）</span>
                          )}
                        </p>
                        <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {formatTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.bristolType != null ? `Bristol Type ${item.bristolType}` : '已设为不可见'}
                        {item.notes ? ` · ${item.notes.slice(0, 20)}` : ''}
                      </p>
                    </div>
                    {item.score != null && (
                      <div className={`text-lg font-bold ${scoreColor(item.score)}`}>
                        {item.score}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mb-6"
          >
            <ChatPanel familyId={familyId} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave */}
      <motion.button
        variants={fadeUp}
        onClick={leave}
        whileTap={{ scale: 0.97 }}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white/80 py-3.5 text-sm font-medium text-red-600 backdrop-blur-sm hover:bg-red-50 dark:border-red-800/60 dark:bg-gray-800/80 dark:text-red-400 dark:hover:bg-red-900/20"
      >
        <LogOut size={16} />
        {detail.members.length === 1 ? '解散家庭' : '退出家庭'}
      </motion.button>
    </motion.div>
  );
}

/* ───── Modal (create / join) ─────────────────────────────── */

function ActionModal({
  mode,
  onClose,
  onSuccess,
}: {
  mode: 'create' | 'join';
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setError('');
    const v = value.trim();
    if (!v) {
      setError(mode === 'create' ? '请输入家庭名称' : '请输入邀请码');
      return;
    }
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await api.post('/family', { name: v });
      } else {
        await api.post('/family/join', { inviteCode: v.toUpperCase() });
      }
      onSuccess();
    } catch (e: any) {
      setError(e?.response?.data?.message || '操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 240, damping: 26 }}
        className="fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-gray-900 lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2 lg:rounded-3xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {mode === 'create' ? '创建家庭' : '加入家庭'}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {mode === 'create'
                ? '创建后会得到一个邀请码，可分享给家人'
                : '输入家人分享给你的 6 位邀请码'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => {
            const v = mode === 'join' ? e.target.value.toUpperCase() : e.target.value;
            setValue(v);
            setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={mode === 'create' ? '例如：我的家' : '例如：A1B2C3'}
          maxLength={mode === 'join' ? 6 : 30}
          className={`w-full rounded-xl border bg-gray-50 px-4 py-3 text-sm outline-none transition-colors focus:border-primary-400 focus:bg-white dark:bg-gray-800 dark:text-white dark:focus:bg-gray-700 ${
            error ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'
          } ${mode === 'join' ? 'text-center font-mono text-lg tracking-widest' : ''}`}
        />

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 text-xs text-red-500"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        <button
          onClick={submit}
          disabled={submitting}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? (
            <motion.div
              className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          ) : mode === 'create' ? (
            '创建'
          ) : (
            '加入'
          )}
        </button>
      </motion.div>
    </>
  );
}

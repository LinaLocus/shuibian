import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MessageCircle } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { useViewportHeight } from '../hooks/useKeyboard';

interface Message {
  id: string;
  userId: string;
  nickname: string;
  content: string;
  createdAt: string;
}

const POLL_INTERVAL = 3000;

function formatTime(d: string) {
  const date = new Date(d);
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const time = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  if (sameDay) return time;
  return `${date.getMonth() + 1}/${date.getDate()} ${time}`;
}

function colorFor(userId: string) {
  let h = 0;
  for (let i = 0; i < userId.length; i++) h = (h * 31 + userId.charCodeAt(i)) >>> 0;
  const palette = [
    'from-rose-400 to-pink-500',
    'from-amber-400 to-orange-500',
    'from-emerald-400 to-teal-500',
    'from-sky-400 to-blue-500',
    'from-violet-400 to-purple-500',
    'from-fuchsia-400 to-pink-500',
  ];
  return palette[h % palette.length];
}

export default function ChatPanel({ familyId }: { familyId: string }) {
  const { user } = useAuth();
  const vh = useViewportHeight();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const lastIdRef = useRef<string | null>(null);
  const lastTimeRef = useRef<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);

  const scrollToBottom = (smooth = true) => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  const checkSticky = () => {
    const el = listRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distance < 80;
  };

  useEffect(() => {
    let mounted = true;
    let timer: ReturnType<typeof setTimeout>;

    const loadInitial = async () => {
      try {
        const res = await api.get<Message[]>(`/family/${familyId}/messages`);
        if (!mounted) return;
        setMessages(res.data);
        if (res.data.length) {
          lastIdRef.current = res.data[res.data.length - 1].id;
          lastTimeRef.current = res.data[res.data.length - 1].createdAt;
        }
        setLoading(false);
        requestAnimationFrame(() => scrollToBottom(false));
      } catch {
        if (mounted) {
          setError('加载消息失败');
          setLoading(false);
        }
      }
    };

    const poll = async () => {
      if (!lastTimeRef.current) {
        timer = setTimeout(poll, POLL_INTERVAL);
        return;
      }
      try {
        const res = await api.get<Message[]>(
          `/family/${familyId}/messages?since=${encodeURIComponent(lastTimeRef.current)}`,
        );
        if (!mounted) return;
        if (res.data.length) {
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const fresh = res.data.filter((m) => !seen.has(m.id));
            if (fresh.length === 0) return prev;
            const last = fresh[fresh.length - 1];
            lastIdRef.current = last.id;
            lastTimeRef.current = last.createdAt;
            return [...prev, ...fresh];
          });
          if (stickToBottomRef.current) {
            requestAnimationFrame(() => scrollToBottom(true));
          }
        }
      } catch {
        /* network blip — try again next tick */
      } finally {
        if (mounted) timer = setTimeout(poll, POLL_INTERVAL);
      }
    };

    loadInitial().then(() => {
      if (mounted) timer = setTimeout(poll, POLL_INTERVAL);
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [familyId]);

  useEffect(() => {
    if (stickToBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom(false));
    }
  }, [vh]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await api.post<Message>(`/family/${familyId}/messages`, { content: text });
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.data.id)) return prev;
        return [...prev, res.data];
      });
      lastIdRef.current = res.data.id;
      lastTimeRef.current = res.data.createdAt;
      setInput('');
      stickToBottomRef.current = true;
      requestAnimationFrame(() => scrollToBottom(true));
    } catch (e: any) {
      setError(e?.response?.data?.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  // Reserve ~240px for page chrome on top; floor at 320px so it never collapses.
  const panelHeight = Math.max(320, vh - 240);

  return (
    <div
      style={{ height: panelHeight }}
      className="flex flex-col overflow-hidden rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm dark:border-gray-700/60 dark:bg-gray-800/80"
    >
      {/* Messages */}
      <div
        ref={listRef}
        onScroll={checkSticky}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {loading ? (
          <div className="space-y-3">
            <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700/50" />
            <div className="ml-auto h-12 w-2/3 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700/50" />
            <div className="h-12 w-3/4 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700/50" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MessageCircle
              size={36}
              className="mb-2 text-gray-300 dark:text-gray-600"
              strokeWidth={1.5}
            />
            <p className="text-sm text-gray-400 dark:text-gray-500">还没有消息</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">说点什么开启家庭对话吧</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => {
              const isMe = m.userId === user?.id;
              const prev = messages[i - 1];
              const showAvatar = !prev || prev.userId !== m.userId;
              const showTime =
                !prev ||
                new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60 * 1000;
              return (
                <div key={m.id}>
                  {showTime && (
                    <p className="my-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
                      {formatTime(m.createdAt)}
                    </p>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                    className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                  >
                    <div className="w-8 flex-shrink-0">
                      {showAvatar && (
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow ${colorFor(m.userId)}`}
                        >
                          {m.nickname.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div
                      className={`flex max-w-[75%] flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {showAvatar && !isMe && (
                        <p className="mb-0.5 px-1 text-[11px] text-gray-500 dark:text-gray-400">
                          {m.nickname}
                        </p>
                      )}
                      <div
                        className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                          isMe
                            ? 'rounded-br-md bg-primary-500 text-white'
                            : 'rounded-bl-md bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-red-100 bg-red-50 px-4 py-1.5 text-xs text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="flex items-end gap-2 border-t border-gray-100 bg-white/90 px-3 py-2.5 backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/90">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          maxLength={500}
          placeholder="说点什么…"
          className="max-h-32 min-h-[40px] flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition-colors focus:border-primary-400 focus:bg-white dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:focus:bg-gray-600"
        />
        <motion.button
          onClick={send}
          disabled={!input.trim() || sending}
          whileTap={{ scale: 0.92 }}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/30 disabled:opacity-40"
          aria-label="发送"
        >
          {sending ? (
            <motion.div
              className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            <Send size={16} />
          )}
        </motion.button>
      </div>
    </div>
  );
}

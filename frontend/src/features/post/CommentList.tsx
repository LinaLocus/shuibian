import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Trash2 } from 'lucide-react';
import { addComment, deleteComment, PostComment } from './postApi';

interface Props {
  postId: string;
  comments: PostComment[];
  onAdd: (c: PostComment) => void;
  onDelete: (commentId: string) => void;
}

export default function CommentList({ postId, comments, onAdd, onDelete }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (submitting || !text.trim()) return;
    setSubmitting(true);
    try {
      const c = await addComment(postId, text.trim());
      onAdd(c);
      setText('');
      setShowInput(false);
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(postId, commentId);
      onDelete(commentId);
    } catch {}
  };

  return (
    <div>
      {comments.length > 0 && (
        <div className="mt-3 space-y-1.5 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/50">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-1.5 text-xs">
              <span className="font-medium text-primary-600 dark:text-primary-400">{c.nickname}</span>
              <span className="flex-1 text-gray-700 dark:text-gray-300">：{c.content}</span>
              {c.isMe && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setShowInput(!showInput)}
        className="mt-2 text-xs text-gray-500 hover:text-primary-600 dark:text-gray-400"
      >
        {showInput ? '取消' : '评论'}
      </button>

      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 flex gap-2"
          >
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="说点什么…"
              maxLength={200}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 focus:border-primary-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !text.trim()}
              className="flex items-center justify-center rounded-lg bg-primary-500 px-3 text-white disabled:opacity-50"
            >
              <Send size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

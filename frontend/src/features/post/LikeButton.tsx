import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { likePost, unlikePost } from './postApi';

interface Props {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export default function LikeButton({ postId, initialLiked, initialCount }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);

  const toggle = async () => {
    const next = !liked;
    setLiked(next);
    setCount(count + (next ? 1 : -1));
    if (next) setAnimating(true);
    try {
      if (next) await likePost(postId);
      else await unlikePost(postId);
    } catch {
      setLiked(!next);
      setCount(count);
    }
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-rose-500 dark:text-gray-400"
    >
      <motion.div
        animate={animating ? { scale: [1, 1.4, 1] } : {}}
        transition={{ duration: 0.4 }}
        onAnimationComplete={() => setAnimating(false)}
        className="relative"
      >
        <Heart
          size={16}
          className={liked ? 'fill-rose-500 text-rose-500' : ''}
          strokeWidth={liked ? 2 : 1.8}
        />
        <AnimatePresence>
          {animating && (
            <motion.div
              key={Date.now()}
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: 2.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 rounded-full bg-rose-400"
            />
          )}
        </AnimatePresence>
      </motion.div>
      <span className={liked ? 'text-rose-500' : ''}>{count > 0 ? count : '心'}</span>
    </button>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, RefreshCw } from 'lucide-react';
import PostComposer from './PostComposer';
import PostCard from './PostCard';
import { PostItem, fetchPosts } from './postApi';

export default function PostListPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchPosts({ limit: 30 });
      setPosts(res.posts);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(true);
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10">
      <header className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={22} className="text-primary-600 dark:text-primary-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">家人雅集</h1>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="mr-12 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 lg:mr-0 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="刷新"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
        </button>
      </header>

      <PostComposer onPosted={() => load(true)} />

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : posts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center"
        >
          <BookOpen size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">尚无雅集，发一笔记一刻</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              onDeleted={(id) => setPosts(posts.filter((x) => x.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, MessageCircle } from 'lucide-react';
import { PostItem, PostComment, deletePost } from './postApi';
import LikeButton from './LikeButton';
import CommentList from './CommentList';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

interface Props {
  post: PostItem;
  onDeleted: (id: string) => void;
}

export default function PostCard({ post, onDeleted }: Props) {
  const [comments, setComments] = useState<PostComment[]>(post.comments);
  const [fullImage, setFullImage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!confirm('确认删除这条雅集？')) return;
    try {
      await deletePost(post.id);
      onDeleted(post.id);
    } catch {}
  };

  const renderImageGrid = () => {
    if (post.imageUrls.length === 0) return null;
    if (post.imageUrls.length === 1) {
      return (
        <button
          onClick={() => setFullImage(post.imageUrls[0])}
          className="mt-2 block max-h-80 w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-900"
        >
          <img src={post.imageUrls[0]} alt="" className="h-full w-full object-cover" />
        </button>
      );
    }
    const cols = post.imageUrls.length === 4 ? 'grid-cols-2' : 'grid-cols-3';
    return (
      <div className={`mt-2 grid gap-1 ${cols}`}>
        {post.imageUrls.map((url) => (
          <button
            key={url}
            onClick={() => setFullImage(url)}
            className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900"
          >
            <img src={url} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    );
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-300 to-primary-500 text-sm font-medium text-white">
          {post.author.avatar ? (
            <img src={post.author.avatar} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            post.author.nickname.slice(0, 1)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{post.author.nickname}</p>
            {post.isMine && (
              <button
                onClick={handleDelete}
                className="text-gray-400 hover:text-red-500"
                aria-label="删除"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400">
            {post.familyName} · {timeAgo(post.createdAt)}
          </p>
        </div>
      </header>

      {post.content && (
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {post.content}
        </p>
      )}

      {renderImageGrid()}

      <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3 dark:border-gray-700">
        <LikeButton postId={post.id} initialLiked={post.likedByMe} initialCount={post.likeCount} />
        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
          <MessageCircle size={14} />
          <span>{comments.length > 0 ? comments.length : '评论'}</span>
        </div>
      </div>

      <CommentList
        postId={post.id}
        comments={comments}
        onAdd={(c) => setComments([...comments, c])}
        onDelete={(id) => setComments(comments.filter((x) => x.id !== id))}
      />

      {fullImage && (
        <div
          onClick={() => setFullImage(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
        >
          <img src={fullImage} alt="" className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </motion.article>
  );
}

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, X, ChevronDown } from 'lucide-react';
import { createPost, fetchMyFamilies, FamilySummary } from './postApi';
import ImageUploader from './ImageUploader';

interface Props {
  onPosted: () => void;
}

export default function PostComposer({ onPosted }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [families, setFamilies] = useState<FamilySummary[]>([]);
  const [familyId, setFamilyId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showImageUploader, setShowImageUploader] = useState(false);

  useEffect(() => {
    fetchMyFamilies()
      .then((list) => {
        setFamilies(list);
        if (list.length > 0) setFamilyId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const reset = () => {
    setContent('');
    setImages([]);
    setExpanded(false);
    setError('');
    setShowImageUploader(false);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!content.trim() && images.length === 0) {
      setError('请输入内容或选择图片');
      return;
    }
    if (!familyId) {
      setError('请先加入一个家庭');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await createPost({ familyId, content: content.trim(), imageUrls: images.length > 0 ? images : undefined });
      reset();
      onPosted();
    } catch (err: any) {
      setError(err.response?.data?.message || '发布失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (families.length === 0) {
    return (
      <div className="mb-4 rounded-2xl border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500">
        加入一个家庭后才能发布雅集
      </div>
    );
  }

  return (
    <motion.div
      layout
      className="mb-4 overflow-hidden rounded-2xl border border-gray-200/70 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
    >
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-gray-400 transition-colors hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-700/50"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-200 to-primary-400" />
          <span>记一笔，分享与家人的此刻…</span>
        </button>
      ) : (
        <div className="p-4">
          {families.length > 1 && (
            <div className="mb-3">
              <label className="mb-1 block text-xs text-gray-500 dark:text-gray-400">发布到</label>
              <div className="relative">
                <select
                  value={familyId}
                  onChange={(e) => setFamilyId(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 pr-8 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  {families.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          )}

          <textarea
            autoFocus
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="此刻心绪…"
            maxLength={1000}
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary-400 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          />

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((url, i) => (
                <div key={url} className="relative aspect-square overflow-hidden rounded-lg">
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => setImages(images.filter((_, j) => j !== i))}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {showImageUploader && (
            <div className="mt-3">
              <ImageUploader
                existing={images}
                onChange={setImages}
                onError={setError}
              />
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 text-xs text-red-500"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImageUploader(!showImageUploader)}
                disabled={images.length >= 9}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50 dark:bg-gray-700 dark:text-gray-300"
                aria-label="添加图片"
              >
                <ImageIcon size={18} />
              </button>
              <span className="text-xs text-gray-400">{content.length}/1000</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={reset}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-1 rounded-lg bg-primary-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-600 disabled:opacity-50"
              >
                <Send size={14} />
                {submitting ? '发布中' : '发布'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

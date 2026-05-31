import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Navigation, RefreshCw, AlertCircle, Phone } from 'lucide-react';
import {
  ToiletItem,
  UserLocation,
  fetchNearbyToilets,
  getCurrentLocation,
  openInMapApp,
} from './toiletApi';

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function JieyouPage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [toilets, setToilets] = useState<ToiletItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      const list = await fetchNearbyToilets(loc.longitude, loc.latitude);
      setToilets(list);
      if (list.length === 0) {
        setError('附近 3 公里内未找到公共厕所');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || '搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search();
  }, [search]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6 lg:max-w-2xl lg:px-8 lg:py-10">
      <header className="mb-5 flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-gray-600 backdrop-blur-sm transition-colors hover:bg-white dark:bg-gray-800/80 dark:text-gray-300"
          aria-label="返回"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">解忧之所</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">附近的公共厕所</p>
        </div>
        <button
          onClick={search}
          disabled={loading}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="刷新"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {location && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-primary-50 px-3 py-2 text-xs text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
          <MapPin size={12} />
          <span>已获取您的位置 · 误差 ±{Math.round(location.accuracy)} m</span>
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-2 rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-700 dark:bg-orange-900/20 dark:text-orange-300"
        >
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {loading && toilets.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : toilets.length > 0 ? (
        <div className="space-y-3">
          {toilets.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="rounded-2xl border border-gray-200/70 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-300 to-primary-500 text-white">
                  <MapPin size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 leading-snug">
                      {t.name}
                    </h3>
                    <span className="flex-shrink-0 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      {formatDistance(t.distance)}
                    </span>
                  </div>
                  {t.address && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      {t.address}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      onClick={() => openInMapApp(t)}
                      className="flex items-center gap-1 rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-primary-600"
                    >
                      <Navigation size={12} />
                      导航前往
                    </button>
                    {t.phone && (
                      <a
                        href={`tel:${t.phone}`}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        <Phone size={12} />
                        电话
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : !error ? (
        <div className="py-16 text-center">
          <MapPin size={40} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">点击右上角刷新搜索</p>
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
        数据来源：高德地图
      </p>
    </div>
  );
}

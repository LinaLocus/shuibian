import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RecordFormData } from '../RecordFlow';

interface Props {
  data: RecordFormData;
  onChange: (updates: Partial<RecordFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const colors = [
  { value: 'brown', label: '棕色', hex: '#8B4513' },
  { value: 'dark_brown', label: '深棕', hex: '#3E2723' },
  { value: 'yellow', label: '黄色', hex: '#F9A825' },
  { value: 'green', label: '绿色', hex: '#388E3C' },
  { value: 'black', label: '黑色', hex: '#212121' },
  { value: 'red', label: '红色', hex: '#C62828' },
  { value: 'pale', label: '浅色', hex: '#D7CCC8' },
];

const efforts = [
  { value: 'easy', label: '轻松' },
  { value: 'moderate', label: '适中' },
  { value: 'hard', label: '费力' },
];

const durations = [
  { value: 1, label: '1分钟' },
  { value: 3, label: '3分钟' },
  { value: 5, label: '5分钟' },
  { value: 10, label: '10分钟' },
  { value: 15, label: '15+分钟' },
];

export default function BasicInfoStep({ data, onChange, onNext, onBack }: Props) {
  const [showErrors, setShowErrors] = useState(false);
  const isValid = data.color && data.effort && data.comfort > 0 && data.duration > 0;

  const handleNext = () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    onNext();
  };

  return (
    <div>
      <h2 className="mb-4 text-center text-xl font-semibold text-gray-800 dark:text-white">
        基础信息
      </h2>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          颜色
        </label>
        <div className="flex flex-wrap gap-2">
          {colors.map((c) => (
            <motion.button
              key={c.value}
              onClick={() => { onChange({ color: c.value }); setShowErrors(false); }}
              className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm ${
                data.color === c.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
              }`}
              whileTap={{ scale: 0.93 }}
              animate={
                data.color === c.value ? { scale: 1.05 } : { scale: 1 }
              }
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <span
                className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: c.hex }}
              />
              <span className="dark:text-gray-200">{c.label}</span>
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {showErrors && !data.color && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs text-red-500">请选择颜色</motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          用力程度
        </label>
        <div className="flex gap-2">
          {efforts.map((e) => (
            <motion.button
              key={e.value}
              onClick={() => { onChange({ effort: e.value }); setShowErrors(false); }}
              className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-medium ${
                data.effort === e.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {e.label}
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {showErrors && !data.effort && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs text-red-500">请选择用力程度</motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          舒适度
        </label>
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.button
              key={n}
              onClick={() => { onChange({ comfort: n }); setShowErrors(false); }}
              className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-lg font-semibold ${
                data.comfort === n
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
              whileTap={{ scale: 0.9 }}
              animate={data.comfort === n ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {n}
            </motion.button>
          ))}
        </div>
        <div className="mt-1 flex justify-between text-xs text-gray-400 dark:text-gray-500">
          <span>很不舒服</span>
          <span>很舒适</span>
        </div>
        <AnimatePresence>
          {showErrors && data.comfort === 0 && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs text-red-500">请选择舒适度</motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          时长
        </label>
        <div className="flex flex-wrap gap-2">
          {durations.map((d) => (
            <motion.button
              key={d.value}
              onClick={() => { onChange({ duration: d.value }); setShowErrors(false); }}
              className={`rounded-xl border-2 px-3.5 py-2 text-sm font-medium ${
                data.duration === d.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
              whileTap={{ scale: 0.93 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {d.label}
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {showErrors && !data.duration && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-1.5 text-xs text-red-500">请选择时长</motion.p>
          )}
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <motion.button
          onClick={onBack}
          className="flex-1 rounded-2xl border-2 border-gray-200 py-3 font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
          whileTap={{ scale: 0.97 }}
        >
          上一步
        </motion.button>
        <motion.button
          onClick={handleNext}
          className="flex-[2] rounded-2xl bg-primary-500 py-3 font-medium text-white shadow-lg shadow-primary-500/30"
          whileTap={{ scale: 0.97 }}
          animate={showErrors && !isValid ? { x: [0, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          下一步
        </motion.button>
      </div>
    </div>
  );
}

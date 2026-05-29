import { motion } from 'framer-motion';

interface Props {
  selected: string[];
  onChange: (symptoms: string[]) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting?: boolean;
}

const symptomOptions = ['腹痛', '出血', '黏液', '气味异常', '不尽感'];

export default function SymptomsStep({
  selected,
  onChange,
  onSubmit,
  onBack,
  submitting,
}: Props) {
  const toggle = (symptom: string) => {
    if (selected.includes(symptom)) {
      onChange(selected.filter((s) => s !== symptom));
    } else {
      onChange([...selected, symptom]);
    }
  };

  return (
    <div>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-800 dark:text-white">
        伴随症状
      </h2>
      <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-400">
        选择本次排便的伴随症状，无则直接提交
      </p>

      <div className="mb-8 flex flex-wrap justify-center gap-3">
        {symptomOptions.map((symptom, i) => (
          <motion.button
            key={symptom}
            onClick={() => toggle(symptom)}
            className={`rounded-2xl border-2 px-5 py-2.5 text-sm font-medium ${
              selected.includes(symptom)
                ? 'border-red-400 bg-red-50 text-red-600 dark:border-red-600 dark:bg-red-900/30 dark:text-red-300'
                : 'border-gray-200 bg-white text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: i * 0.05,
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
            whileTap={{ scale: 0.9 }}
          >
            <motion.span
              animate={
                selected.includes(symptom)
                  ? { scale: [1, 1.2, 1] }
                  : { scale: 1 }
              }
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            >
              {symptom}
            </motion.span>
          </motion.button>
        ))}
      </div>

      {selected.includes('出血') && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300"
        >
          ⚠️ 检测到出血症状，建议关注后续评分并考虑就医。
        </motion.div>
      )}

      <div className="flex gap-3">
        <motion.button
          onClick={onBack}
          className="flex-1 rounded-2xl border-2 border-gray-200 py-3.5 font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
          whileTap={{ scale: 0.97 }}
        >
          上一步
        </motion.button>
        <motion.button
          onClick={onSubmit}
          disabled={submitting}
          className="flex-[2] rounded-2xl bg-primary-500 py-3.5 font-medium text-white shadow-lg shadow-primary-500/30 disabled:opacity-60"
          whileTap={submitting ? undefined : { scale: 0.97 }}
        >
          {submitting ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : (
            '提交记录'
          )}
        </motion.button>
      </div>
    </div>
  );
}

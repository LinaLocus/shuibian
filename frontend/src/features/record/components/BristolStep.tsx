import { motion } from 'framer-motion';

interface Props {
  value: number;
  onChange: (type: number) => void;
  onNext: () => void;
}

const bristolTypes = [
  { type: 1, label: '硬块状', desc: '分离的硬块，像坚果', icon: '●●●' },
  { type: 2, label: '块状', desc: '腊肠状但表面凹凸', icon: '◆◆' },
  { type: 3, label: '裂纹状', desc: '腊肠状表面有裂纹', icon: '═══' },
  { type: 4, label: '光滑状', desc: '像腊肠或蛇，光滑柔软', icon: '━━━' },
  { type: 5, label: '软块状', desc: '柔软的块状，边缘清晰', icon: '◎◎' },
  { type: 6, label: '糊状', desc: '蓬松的碎片，边缘粗糙', icon: '≋≋≋' },
  { type: 7, label: '水状', desc: '完全液体，无固体', icon: '〰〰' },
];

export default function BristolStep({ value, onChange, onNext }: Props) {
  return (
    <div>
      <h2 className="mb-1 text-center text-xl font-semibold text-gray-800 dark:text-white">
        便便形态
      </h2>
      <p className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
        选择最接近的 Bristol 分类
      </p>

      <div className="grid grid-cols-1 gap-3">
        {bristolTypes.map((item) => (
          <motion.button
            key={item.type}
            onClick={() => onChange(item.type)}
            className={`relative flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
              value === item.type
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600'
            }`}
            whileTap={{ scale: 0.97 }}
            animate={
              value === item.type
                ? {
                    scale: 1.02,
                    boxShadow: '0 0 20px rgba(76, 175, 80, 0.3)',
                  }
                : { scale: 1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
            }
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-sm dark:bg-gray-700 dark:text-gray-200">
              {item.icon}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  Type {item.type}
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-100">{item.label}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
            </div>
            {value === item.type && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500"
              >
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      <motion.button
        onClick={onNext}
        disabled={!value}
        className="mt-6 w-full rounded-2xl bg-primary-500 py-3.5 font-medium text-white shadow-lg shadow-primary-500/30 disabled:opacity-40 disabled:shadow-none"
        whileTap={{ scale: 0.97 }}
      >
        下一步
      </motion.button>
    </div>
  );
}

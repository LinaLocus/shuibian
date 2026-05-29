import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import BristolStep from './components/BristolStep';
import BasicInfoStep from './components/BasicInfoStep';
import SymptomsStep from './components/SymptomsStep';
import ScoreReveal from './components/ScoreReveal';

export interface RecordFormData {
  bristolType: number;
  color: string;
  effort: string;
  comfort: number;
  duration: number;
  symptoms: string[];
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

export default function RecordFlow() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<RecordFormData>({
    bristolType: 0,
    color: '',
    effort: '',
    comfort: 0,
    duration: 0,
    symptoms: [],
  });
  const [score, setScore] = useState<{
    score: number;
    advice: string;
    factors: Record<string, number>;
  } | null>(null);

  const goNext = () => {
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const resetFlow = () => {
    setStep(0);
    setDirection(1);
    setFormData({ bristolType: 0, color: '', effort: '', comfort: 0, duration: 0, symptoms: [] });
    setScore(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode: 'quick',
          bristolType: formData.bristolType,
          color: formData.color,
          effort: formData.effort,
          comfort: formData.comfort,
          duration: formData.duration || 5,
          symptoms: formData.symptoms,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `请求失败 (${res.status})`);
      }
      const data = await res.json();
      setScore(data.healthScore);
      goNext();
    } catch (err: any) {
      setError(err.message || '网络异常，请检查连接后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    <BristolStep
      key="bristol"
      value={formData.bristolType}
      onChange={(v) => setFormData({ ...formData, bristolType: v })}
      onNext={goNext}
    />,
    <BasicInfoStep
      key="basic"
      data={formData}
      onChange={(updates) => setFormData({ ...formData, ...updates })}
      onNext={goNext}
      onBack={goBack}
    />,
    <SymptomsStep
      key="symptoms"
      selected={formData.symptoms}
      onChange={(v) => setFormData({ ...formData, symptoms: v })}
      onSubmit={handleSubmit}
      onBack={goBack}
      submitting={submitting}
    />,
    <ScoreReveal key="score" score={score} onReset={resetFlow} formData={formData} />,
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-950">
      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed left-4 right-4 top-4 z-50 mx-auto max-w-md rounded-xl bg-red-500 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
            onClick={() => setError('')}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {step < 3 && (
        <div className="mx-auto mb-6 flex max-w-md justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-1.5 rounded-full"
              animate={{
                width: i === step ? 32 : 12,
                backgroundColor: i <= step ? '#4CAF50' : '#E5E7EB',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
          ))}
        </div>
      )}

      <div className="mx-auto max-w-md overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {steps[step]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

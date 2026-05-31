import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { AlertItem, fetchFamilyDangerAlerts } from './alertApi';

interface Props {
  familyId: string;
}

export default function FamilyAlertBanner({ familyId }: Props) {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFamilyDangerAlerts(familyId)
      .then(setAlerts)
      .catch(() => {});
  }, [familyId]);

  if (alerts.length === 0) return null;

  return (
    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={16} className="text-red-500" />
        <span className="text-sm font-medium text-red-700 dark:text-red-300">紧急告警</span>
      </div>
      {alerts.map((a) => (
        <button
          key={a.id}
          onClick={() => navigate('/alerts')}
          className="mb-1 block w-full text-left text-xs text-red-600 dark:text-red-400 hover:underline"
        >
          {a.title}
        </button>
      ))}
    </div>
  );
}

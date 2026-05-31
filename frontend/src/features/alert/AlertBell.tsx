import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { fetchUnreadCount } from './alertApi';

export default function AlertBell() {
  const [count, setCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    const poll = () => {
      fetchUnreadCount()
        .then((c) => { if (active) setCount(c); })
        .catch(() => {});
    };
    poll();
    const id = setInterval(poll, 60_000);
    return () => { active = false; clearInterval(id); };
  }, []);

  return (
    <button
      onClick={() => navigate('/alerts')}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      aria-label="告警通知"
    >
      <Bell size={20} strokeWidth={1.8} />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

import api from '../../api/client';

export interface AlertItem {
  id: string;
  alertId: string;
  type: 'danger_signal' | 'score_drop' | 'chronic_trend';
  severity: 'danger' | 'warn' | 'info';
  title: string;
  summary: string;
  payload: object | null;
  readAt: string | null;
  createdAt: string;
}

export async function fetchAlerts(opts: { unread?: boolean; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  if (opts.unread) params.set('unread', 'true');
  if (opts.page) params.set('page', String(opts.page));
  if (opts.limit) params.set('limit', String(opts.limit));
  const { data } = await api.get(`/alerts?${params}`);
  return data as { alerts: AlertItem[]; total: number; page: number; limit: number };
}

export async function fetchUnreadCount(): Promise<number> {
  const { data } = await api.get('/alerts/unread-count');
  return data.count;
}

export async function markRead(id: string): Promise<void> {
  await api.post(`/alerts/${id}/read`);
}

export async function markAllRead(): Promise<void> {
  await api.post('/alerts/read-all');
}

export async function fetchFamilyDangerAlerts(familyId: string): Promise<AlertItem[]> {
  const { data } = await api.get(`/alerts/family/${familyId}/danger`);
  return data;
}

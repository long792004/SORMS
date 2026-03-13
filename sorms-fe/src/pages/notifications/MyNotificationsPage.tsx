import { useEffect, useState } from 'react';
import { notificationApi } from '../../api/notifications';
import type { NotificationDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { Bell, CheckCircle } from 'lucide-react';

export default function MyNotificationsPage({ isStaff = false }: { isStaff?: boolean }) {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [isStaff]);

  const load = async () => {
    try {
      const res = isStaff ? await notificationApi.getStaffNotifications() : await notificationApi.getMyNotifications();
      setNotifications(res.data);
    } catch { /* noop */ } finally { setLoading(false); }
  };

  const markRead = async (id: number) => {
    try { await notificationApi.markAsRead(id); load(); } catch { /* noop */ }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-5xl space-y-5">
      <div className="page-header">
        <h1 className="page-title">
        {isStaff ? 'Staff' : 'My'} Notifications
        </h1>
        <p className="page-subtitle">Stay updated with recent activity and announcements.</p>
      </div>

      {notifications.length === 0 ? <EmptyState message="No notifications" /> : (
        <div className="grid gap-3">
          {notifications.map((n) => (
            <div key={n.id} className="glass-card flex items-start gap-3 p-4" style={{ opacity: n.isRead ? 0.72 : 1, borderLeft: n.isRead ? '1px solid var(--border-glass)' : '3px solid var(--color-primary)' }}>
              <Bell size={18} className="mt-0.5 shrink-0" style={{ color: n.isRead ? 'var(--text-muted)' : 'var(--color-primary)' }} />
              <div className="flex-1">
                <p className="text-sm text-[var(--text-primary)]">{n.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-[var(--text-muted)]">{new Date(n.createdAt).toLocaleString()}</span>
                  <span className={`badge ${n.type === 'Broadcast' ? 'badge-info' : 'badge-default'}`}>{n.type}</span>
                  {n.targetRole && <span className="badge badge-default">{n.targetRole}</span>}
                </div>
              </div>
              {!n.isRead && (
                <button onClick={() => markRead(n.id)} className="btn btn-ghost btn-sm" title="Mark as read">
                  <CheckCircle size={16} className="text-emerald-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

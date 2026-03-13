import { useEffect, useState } from 'react';
import { notificationApi } from '../../api/notifications';
import type { NotificationDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

export default function SentHistoryPage() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationApi.getSentHistory().then((r) => setNotifications(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-6xl space-y-5">
      <div className="page-header">
        <h1 className="page-title">Sent Notification History</h1>
        <p className="page-subtitle">Review all notification messages previously sent by the system.</p>
      </div>

      <div className="glass-card panel">
        {notifications.length === 0 ? <EmptyState message="No notifications sent" /> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Message</th><th>Type</th><th>Target</th><th>Created</th></tr></thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n.id}>
                    <td className="max-w-[320px] whitespace-normal break-words">{n.message}</td>
                    <td><span className={`badge ${n.type === 'Broadcast' ? 'badge-info' : 'badge-default'}`}>{n.type}</span></td>
                    <td>{n.targetRole || `Resident #${n.residentId}`}</td>
                    <td className="text-xs">{new Date(n.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

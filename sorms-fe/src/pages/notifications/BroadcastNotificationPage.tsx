import { useState } from 'react';
import { notificationApi } from '../../api/notifications';
import { Send } from 'lucide-react';

export default function BroadcastNotificationPage() {
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('All');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      await notificationApi.broadcast({ message, targetRole });
      setSuccess('Broadcast sent successfully!');
      setMessage('');
    } catch (err: any) {
      setError(err.response?.data || 'Failed to send.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-shell max-w-3xl space-y-5">
      <div className="page-header">
        <h1 className="page-title">Broadcast Notification</h1>
        <p className="page-subtitle">Send a single message to a full audience segment.</p>
      </div>

      <div className="glass-card p-6">
        {error && <div className="alert-banner alert-error mb-4">{error}</div>}
        {success && <div className="alert-banner alert-success mb-4">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label">Target Audience</label>
            <select className="form-input" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
              <option value="All">All Users</option>
              <option value="Resident">Residents Only</option>
              <option value="Staff">Staff Only</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="form-label">Message *</label>
            <textarea className="form-input" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={500} placeholder="Enter notification message..." />
            <p className="mt-1 text-xs text-[var(--text-muted)]">{message.length}/500</p>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Send size={18} /> {loading ? 'Sending...' : 'Send Broadcast'}
          </button>
        </form>
      </div>
    </div>
  );
}

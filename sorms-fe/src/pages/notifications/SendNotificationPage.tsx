import { useState, useEffect } from 'react';
import { notificationApi } from '../../api/notifications';
import { residentApi } from '../../api/residents';
import type { ResidentDto } from '../../types';
import { Send } from 'lucide-react';

export default function SendNotificationPage() {
  const [message, setMessage] = useState('');
  const [residentId, setResidentId] = useState<number>(0);
  const [residents, setResidents] = useState<ResidentDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    residentApi.getAll().then((r) => setResidents(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      await notificationApi.sendIndividual({ message, residentId });
      setSuccess('Notification sent!');
      setMessage('');
    } catch (err: any) {
      setError(err.response?.data || 'Failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-shell max-w-3xl space-y-5">
      <div className="page-header">
        <h1 className="page-title">Send Individual Notification</h1>
        <p className="page-subtitle">Send a direct message to a selected resident.</p>
      </div>

      <div className="glass-card p-6">
        {error && <div className="alert-banner alert-error mb-4">{error}</div>}
        {success && <div className="alert-banner alert-success mb-4">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label">Select Resident *</label>
            <select className="form-input" value={residentId} onChange={(e) => setResidentId(Number(e.target.value))} required>
              <option value={0}>Choose resident...</option>
              {residents.map((r) => <option key={r.id} value={r.id}>{r.fullName} ({r.email})</option>)}
            </select>
          </div>
          <div className="mb-6">
            <label className="form-label">Message *</label>
            <textarea className="form-input" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} required maxLength={500} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !residentId}>
            <Send size={18} /> {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>
    </div>
  );
}

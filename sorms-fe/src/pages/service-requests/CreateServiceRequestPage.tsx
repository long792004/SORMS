import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceRequestApi } from '../../api/serviceRequests';
import { ArrowLeft, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreateServiceRequestPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', serviceType: 'Maintenance', description: '', priority: 'Normal' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await serviceRequestApi.create(form);
      navigate('/service-requests/my');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create request.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-shell mx-auto content-stack p-4 sm:p-6">
      <div className="hero-banner">
        <div className="hero-grid">
          <div>
            <span className="hero-kicker">Resident support</span>
            <div className="page-header mt-5">
              <h1 className="page-title">Create a service request</h1>
              <p className="page-subtitle">
                Send a clear task to the team with the right category, urgency, and description so it can be handled faster.
              </p>
            </div>
            <div className="page-actions">
              <Link to="/service-requests/my" className="btn btn-secondary btn-sm"><ArrowLeft size={18} /> Back to my requests</Link>
            </div>
          </div>
          <div className="spotlight-card">
            <div className="metric-label">Submission quality</div>
            <div className="mt-3 text-2xl font-extrabold text-[var(--text-primary)]">Well-scoped requests get resolved faster.</div>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Add a concise title and enough context for the operations team to understand the issue without follow-up.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card panel">
        {error && <div className="alert-banner alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="content-stack">
            <div><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-grid-2">
              <div><label className="form-label">Service Type</label>
                <select className="form-input" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
                  <option>Maintenance</option><option>Cleaning</option><option>Electrical</option><option>Plumbing</option><option>Internet</option><option>Other</option>
                </select>
              </div>
              <div><label className="form-label">Priority</label>
                <select className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option>Low</option><option>Normal</option><option>High</option><option>Urgent</option>
                </select>
              </div>
            </div>
            <div><label className="form-label">Description *</label><textarea className="form-input" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required /></div>
          </div>
          <button type="submit" className="btn btn-primary mt-5" disabled={loading}><Send size={18} /> {loading ? 'Submitting...' : 'Submit request'}</button>
        </form>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { reportApi } from '../../api/reports';
import { ArrowLeft, Send } from 'lucide-react';

export default function CreateReportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      await reportApi.create(form);
      navigate('/reports');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-shell max-w-3xl space-y-5">
      <div className="flex items-center gap-4">
        <Link to="/reports" className="btn btn-ghost btn-sm"><ArrowLeft size={18} /></Link>
        <div>
          <h1 className="page-title">Create Report</h1>
          <p className="page-subtitle">Submit a clear report with complete details for review.</p>
        </div>
      </div>

      <div className="glass-card p-6">
        {error && <div className="alert-banner alert-error mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="mb-6"><label className="form-label">Content *</label><textarea className="form-input" rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></div>
          <button type="submit" className="btn btn-primary" disabled={loading}><Send size={18} /> {loading ? 'Submitting...' : 'Submit Report'}</button>
        </form>
      </div>
    </div>
  );
}

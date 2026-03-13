import { useEffect, useState } from 'react';
import { staffApi } from '../../api/staff';
import type { StaffDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Save, User } from 'lucide-react';

export default function StaffProfilePage() {
  const [staff, setStaff] = useState<StaffDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });

  useEffect(() => {
    staffApi.getMyProfile().then(r => {
      setStaff(r.data);
      setForm({ fullName: r.data.fullName, email: r.data.email, phone: r.data.phone });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess(''); setSaving(true);
    try {
      await staffApi.updateMyProfile(form);
      setSuccess('Profile updated!');
    } catch (err: any) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!staff) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Profile not found.</div>;

  return (
    <div className="page-shell mx-auto content-stack p-4 sm:p-6">
      <div className="hero-banner">
        <div className="hero-grid">
          <div>
            <span className="hero-kicker">Staff workspace</span>
            <div className="page-header mt-5">
              <h1 className="page-title">Manage your staff profile</h1>
              <p className="page-subtitle">
                Update your direct contact details so service and operations teams always have the right information.
              </p>
            </div>
          </div>
          <div className="spotlight-card flex flex-col justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="identity-badge gradient-info"><User size={24} /></div>
              <div>
                <div className="text-lg font-semibold text-[var(--text-primary)]">{staff.fullName}</div>
                <div className="mt-1 text-sm text-[var(--text-muted)]">Staff account owner</div>
              </div>
            </div>
            <div className="page-actions">
              <span className="stat-pill">Operations access</span>
              <span className="stat-pill">Profile self-service</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}
      {success && <div className="alert-banner alert-success">{success}</div>}
      <div className="glass-card panel">
        <form onSubmit={handleSubmit}>
          <div className="content-stack">
            <div><label className="form-label">Full Name</label><input className="form-input" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
            <div><label className="form-label">Email</label><input type="email" className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm mt-5" disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save profile'}</button>
        </form>
      </div>
    </div>
  );
}

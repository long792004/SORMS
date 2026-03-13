import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { staffApi } from '../../api/staff';
import { authApi } from '../../api/auth';
import type { StaffDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Save, UserPlus } from 'lucide-react';

export default function StaffFormPage({ isCreate = false }: { isCreate?: boolean }) {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<StaffDto>>({ fullName: '', email: '', phone: '' });
  const [createForm, setCreateForm] = useState({ email: '', userName: '', password: '', fullName: '', phone: '' });

  useEffect(() => {
    if (isEdit) staffApi.getById(Number(id)).then(r => setForm(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try { await staffApi.update(Number(id), form); navigate('/staff'); }
    catch (err: any) { setError(err.response?.data?.message || 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      await authApi.createStaff({ email: createForm.email, userName: createForm.userName, password: createForm.password, roleId: 2, fullName: createForm.fullName, phone: createForm.phone });
      navigate('/staff');
    } catch (err: any) { setError(err.response?.data?.Message || err.response?.data || 'Failed.'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell mx-auto content-stack p-4 sm:p-6">
      <div className="hero-banner">
        <div className="hero-grid">
          <div>
            <span className="hero-kicker">Staff account</span>
            <div className="page-header mt-5">
              <h1 className="page-title">{isCreate ? 'Add a new staff account' : 'Update staff account details'}</h1>
              <p className="page-subtitle">
                Maintain staff contact records and access credentials from one structured operations form.
              </p>
            </div>
            <div className="page-actions">
              <Link to="/staff" className="btn btn-secondary btn-sm"><ArrowLeft size={18} /> Back to staff</Link>
            </div>
          </div>
          <div className="spotlight-card">
            <div className="metric-label">Account setup</div>
            <div className="mt-3 text-2xl font-extrabold text-[var(--text-primary)]">{isCreate ? 'Create a ready-to-use staff login.' : 'Keep staff records accurate and up to date.'}</div>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Staff accounts support service coordination, resident communication, and daily operating workflows.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card panel">
        {error && <div className="alert-banner alert-error">{String(error)}</div>}
        {isCreate ? (
          <form onSubmit={handleSubmitCreate}>
            <div className="content-stack">
              <div><label className="form-label">Full Name *</label><input className="form-input" value={createForm.fullName} onChange={e => setCreateForm({ ...createForm, fullName: e.target.value })} required /></div>
              <div><label className="form-label">Email *</label><input type="email" className="form-input" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required /></div>
              <div><label className="form-label">Username *</label><input className="form-input" value={createForm.userName} onChange={e => setCreateForm({ ...createForm, userName: e.target.value })} required /></div>
              <div><label className="form-label">Password *</label><input type="password" className="form-input" value={createForm.password} onChange={e => setCreateForm({ ...createForm, password: e.target.value })} required minLength={6} /></div>
              <div><label className="form-label">Phone</label><input className="form-input" value={createForm.phone} onChange={e => setCreateForm({ ...createForm, phone: e.target.value })} /></div>
            </div>
            <button type="submit" className="btn btn-primary mt-5" disabled={saving}><UserPlus size={18} /> {saving ? 'Creating...' : 'Create staff account'}</button>
          </form>
        ) : (
          <form onSubmit={handleSubmitEdit}>
            <div className="content-stack">
              <div><label className="form-label">Full Name</label><input className="form-input" value={form.fullName || ''} onChange={e => setForm({ ...form, fullName: e.target.value })} /></div>
              <div><label className="form-label">Email</label><input type="email" className="form-input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="form-label">Phone</label><input className="form-input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="page-actions mt-5">
              <button type="submit" className="btn btn-primary" disabled={saving}><Save size={18} /> Save changes</button>
              <Link to="/staff" className="btn btn-secondary">Cancel</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

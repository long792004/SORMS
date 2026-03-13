import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { residentApi } from '../../api/residents';
import { roomApi } from '../../api/rooms';
import type { ResidentDto, RoomDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Save } from 'lucide-react';

export default function ResidentFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [form, setForm] = useState<Partial<ResidentDto>>({
    fullName: '', email: '', phone: '', identityNumber: '', gender: '',
    roomId: undefined, address: '', emergencyContact: '', notes: '', isActive: true,
  });

  useEffect(() => {
    roomApi.getAll().then((r) => setRooms(r.data)).catch(() => {});
    if (isEdit) {
      residentApi.getById(Number(id)).then((r) => setForm(r.data)).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isEdit) {
        await residentApi.update(Number(id), form);
      } else {
        await residentApi.create(form);
      }
      navigate('/residents');
    } catch (err: any) {
      setError(err.response?.data || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell mx-auto content-stack p-4 sm:p-6">
      <div className="hero-banner">
        <div className="hero-grid">
          <div>
            <span className="hero-kicker">Resident record</span>
            <div className="page-header mt-5">
              <h1 className="page-title">{isEdit ? 'Update resident profile' : 'Create a resident profile'}</h1>
              <p className="page-subtitle">
                Keep identity, contact, and room assignment details organized in one structured form.
              </p>
            </div>
            <div className="page-actions">
              <Link to="/residents" className="btn btn-secondary btn-sm"><ArrowLeft size={18} /> Back to residents</Link>
            </div>
          </div>
          <div className="spotlight-card">
            <div className="metric-label">Form focus</div>
            <div className="mt-3 text-2xl font-extrabold text-[var(--text-primary)]">Store reliable profile and room data.</div>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              This profile supports check-in operations, contact management, and resident-facing services.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card panel">
        {error && (
          <div className="alert-banner alert-error">{typeof error === 'string' ? error : 'An error occurred'}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div>
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Phone *</label>
              <input className="form-input" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div>
              <label className="form-label">Identity Number</label>
              <input className="form-input" value={form.identityNumber || ''} onChange={(e) => setForm({ ...form, identityNumber: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select className="form-input" value={form.gender || ''} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Room</label>
              <select className="form-input" value={form.roomId || ''} onChange={(e) => setForm({ ...form, roomId: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">No room assigned</option>
                {rooms.map((r) => <option key={r.id} value={r.id}>{r.roomNumber} ({r.type || r.roomType})</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Emergency Contact</label>
              <input className="form-input" value={form.emergencyContact || ''} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Notes</label>
              <input className="form-input" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
          <div className="page-actions mt-6">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={18} /> {saving ? 'Saving...' : 'Save'}
            </button>
            <Link to="/residents" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

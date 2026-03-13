import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { residentApi } from '../../api/residents';
import type { ResidentDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { ArrowLeft, Pencil } from 'lucide-react';

export default function ResidentDetailPage() {
  const { id } = useParams();
  const [resident, setResident] = useState<ResidentDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) residentApi.getById(Number(id)).then((r) => setResident(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!resident) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Resident not found.</div>;

  const info = [
    ['Full Name', resident.fullName], ['Email', resident.email],
    ['Phone', resident.phone || resident.phoneNumber], ['Identity Number', resident.identityNumber],
    ['Gender', resident.gender], ['Date of Birth', resident.dateOfBirth ? new Date(resident.dateOfBirth).toLocaleDateString() : '—'],
    ['Room', resident.roomNumber || '—'], ['Address', resident.address],
    ['Emergency Contact', resident.emergencyContact], ['Notes', resident.notes],
    ['Check-In', resident.checkInDate ? new Date(resident.checkInDate).toLocaleDateString() : '—'],
    ['Check-Out', resident.checkOutDate ? new Date(resident.checkOutDate).toLocaleDateString() : '—'],
    ['Created At', resident.createdAt ? new Date(resident.createdAt).toLocaleDateString() : '—'],
  ];

  return (
    <div className="page-shell mx-auto content-stack p-4 sm:p-6">
      <div className="hero-banner">
        <div className="hero-grid">
          <div>
            <span className="hero-kicker">Resident profile</span>
            <div className="page-header mt-5">
              <h1 className="page-title">Resident details at a glance</h1>
              <p className="page-subtitle">
                Review contact information, stay history, and room assignment from a cleaner profile view.
              </p>
            </div>
            <div className="page-actions">
              <Link to="/residents" className="btn btn-secondary btn-sm"><ArrowLeft size={18} /> Back to residents</Link>
              <Link to={`/residents/${id}/edit`} className="btn btn-primary btn-sm"><Pencil size={16} /> Edit resident</Link>
            </div>
          </div>
          <div className="spotlight-card flex flex-col justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="identity-badge gradient-primary">{resident.fullName?.charAt(0)}</div>
              <div>
                <div className="text-lg font-semibold text-[var(--text-primary)]">{resident.fullName}</div>
                <div className="mt-2"><StatusBadge status={resident.isActive ? 'Active' : 'Inactive'} /></div>
              </div>
            </div>
            <div className="page-actions">
              <span className="stat-pill">Room {resident.roomNumber || 'Unassigned'}</span>
              <span className="stat-pill">Resident account</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card panel">
        <div className="detail-grid">
          {info.map(([label, value]) => (
            <div key={label} className="detail-item">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">{label}</p>
              <p className="text-sm leading-6">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

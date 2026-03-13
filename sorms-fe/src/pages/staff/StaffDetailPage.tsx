import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { staffApi } from '../../api/staff';
import type { StaffDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Pencil } from 'lucide-react';

export default function StaffDetailPage() {
  const { id } = useParams();
  const [staff, setStaff] = useState<StaffDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffApi.getById(Number(id)).then((r) => setStaff(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!staff) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Staff not found.</div>;

  return (
    <div className="page-shell mx-auto content-stack p-4 sm:p-6">
      <div className="hero-banner">
        <div className="hero-grid">
          <div>
            <span className="hero-kicker">Staff record</span>
            <div className="page-header mt-5">
              <h1 className="page-title">Staff profile details</h1>
              <p className="page-subtitle">
                Keep contact information and account ownership clear for operations and service coordination.
              </p>
            </div>
            <div className="page-actions">
              <Link to="/staff" className="btn btn-secondary btn-sm"><ArrowLeft size={18} /> Back to staff</Link>
              <Link to={`/staff/${id}/edit`} className="btn btn-primary btn-sm"><Pencil size={16} /> Edit staff</Link>
            </div>
          </div>
          <div className="spotlight-card flex flex-col justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="identity-badge gradient-info">{staff.fullName?.charAt(0)}</div>
              <div>
                <div className="text-lg font-semibold text-[var(--text-primary)]">{staff.fullName}</div>
                <div className="mt-1 text-sm text-[var(--text-muted)]">Staff member</div>
              </div>
            </div>
            <div className="page-actions">
              <span className="stat-pill">Operations team</span>
              <span className="stat-pill">Direct account owner</span>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card panel">
        <div className="detail-grid">
          <div className="detail-item"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Email</p><p className="text-sm leading-6">{staff.email}</p></div>
          <div className="detail-item"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]">Phone</p><p className="text-sm leading-6">{staff.phone || '—'}</p></div>
        </div>
      </div>
    </div>
  );
}

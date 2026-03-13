import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { residentApi } from '../../api/residents';
import type { ResidentDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import NoticeDialog from '../../components/NoticeDialog';
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';

export default function ResidentListPage() {
  const [residents, setResidents] = useState<ResidentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deleteResidentId, setDeleteResidentId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info'
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await residentApi.getAll();
      setResidents(res.data);
    } catch (err: any) {
      const errorMsg = err.response?.status === 403 
        ? 'You do not have permission to view residents.'
        : err.message || 'Failed to load residents.';
      setError(errorMsg);
      console.error('Resident load error:', errorMsg, err);
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async () => {
    if (!deleteResidentId) return;
    try {
      await residentApi.delete(deleteResidentId);
      await load();
      setNotice({
        open: true,
        title: 'Resident Deleted',
        message: 'Resident has been deleted successfully.',
        variant: 'success'
      });
    } catch {
      setNotice({
        open: true,
        title: 'Delete Failed',
        message: 'Failed to delete resident.',
        variant: 'error'
      });
    } finally {
      setDeleteResidentId(null);
    }
  };

  const filtered = residents.filter((r) =>
    r.fullName.toLowerCase().includes(search.toLowerCase()) ||
    r.email.toLowerCase().includes(search.toLowerCase()) ||
    r.phone?.toLowerCase().includes(search.toLowerCase())
  );

  const activeResidents = residents.filter((resident) => resident.isActive).length;
  const assignedRooms = residents.filter((resident) => resident.roomNumber).length;
  const emergencyContacts = residents.filter((resident) => resident.emergencyContact).length;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-7xl space-y-6">
      <div className="hero-banner">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="hero-kicker">Resident directory</span>
            <h1 className="page-title mt-4">Ho so cu dan va tinh trang luu tru</h1>
            <p className="page-subtitle">Hien thi ro thong tin lien lac, tinh trang hoat dong, phong dang o va cac thao tac nhanh nhu mot danh ba luu tru chuyen nghiep.</p>
          </div>
          <Link to="/residents/create" className="btn btn-primary"><Plus size={18} /> Them cu dan</Link>
        </div>

        <div className="listing-summary mt-6">
          <div className="metric-card">
            <div className="metric-label">Tong cu dan</div>
            <div className="metric-value">{residents.length}</div>
            <div className="metric-note">Bao gom toan bo ho so</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Dang hoat dong</div>
            <div className="metric-value">{activeResidents}</div>
            <div className="metric-note">Tai khoan san sang truy cap</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Da gan phong</div>
            <div className="metric-value">{assignedRooms}</div>
            <div className="metric-note">Dang co luu tru thuc te</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Lien he khan cap</div>
            <div className="metric-value">{emergencyContacts}</div>
            <div className="metric-note">Ho so co thong tin du phong</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300/60 bg-red-100/70 px-4 py-3 text-sm text-red-700 dark:border-red-700/60 dark:bg-red-900/25 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="glass-card p-5 sm:p-6">
        <div className="search-shell mb-4">
          <Search size={16} className="search-icon" />
          <input className="form-input search-input" placeholder="Tim theo ten, email, so dien thoai..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? <EmptyState message="No residents found" /> : (
          <div className="table-shell overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ho ten</th><th>Email</th><th>So dien thoai</th><th>Phong</th><th>Trang thai</th><th>Thao tac</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.fullName}</td>
                    <td>{r.email}</td>
                    <td>{r.phone || r.phoneNumber}</td>
                    <td>{r.roomNumber || '—'}</td>
                    <td><StatusBadge status={r.isActive ? 'Active' : 'Inactive'} /></td>
                    <td>
                      <div className="flex gap-1">
                        <Link to={`/residents/${r.id}`} className="btn btn-ghost btn-sm"><Eye size={16} /></Link>
                        <Link to={`/residents/${r.id}/edit`} className="btn btn-ghost btn-sm"><Pencil size={16} /></Link>
                        <button onClick={() => setDeleteResidentId(r.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteResidentId !== null}
        title="Delete Resident"
        message="Are you sure you want to delete this resident? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteResidentId(null)}
      />

      <NoticeDialog
        isOpen={notice.open}
        title={notice.title}
        message={notice.message}
        variant={notice.variant}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}

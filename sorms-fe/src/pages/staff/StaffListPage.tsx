import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { staffApi } from '../../api/staff';
import type { StaffDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import NoticeDialog from '../../components/NoticeDialog';
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';

export default function StaffListPage() {
  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteStaffId, setDeleteStaffId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info'
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await staffApi.getAll(); setStaff(res.data); } catch { /* noop */ } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteStaffId) return;
    try {
      await staffApi.delete(deleteStaffId);
      await load();
      setNotice({ open: true, title: 'Staff Deleted', message: 'Staff member has been deleted successfully.', variant: 'success' });
    } catch {
      setNotice({ open: true, title: 'Delete Failed', message: 'Failed to delete staff member.', variant: 'error' });
    } finally {
      setDeleteStaffId(null);
    }
  };

  const filtered = staff.filter((s) =>
    s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Staff Management</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Manage staff accounts and profile information.</p>
        </div>
        <Link to="/staff/create" className="btn btn-primary"><Plus size={18} /> Add Staff</Link>
      </div>

      <div className="glass-card p-5 sm:p-6">
        <div className="relative mb-4">
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search..." style={{ paddingLeft: '2.25rem' }} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? <EmptyState message="No staff found" /> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.fullName}</td>
                    <td>{s.email}</td>
                    <td>{s.phone}</td>
                    <td>
                      <div className="flex gap-1">
                        <Link to={`/staff/${s.id}`} className="btn btn-ghost btn-sm"><Eye size={16} /></Link>
                        <Link to={`/staff/${s.id}/edit`} className="btn btn-ghost btn-sm"><Pencil size={16} /></Link>
                        <button onClick={() => setDeleteStaffId(s.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
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
        isOpen={deleteStaffId !== null}
        title="Delete Staff"
        message="Are you sure you want to delete this staff member? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteStaffId(null)}
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

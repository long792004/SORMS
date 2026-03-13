import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { roomApi } from '../../api/rooms';
import { buildImageUrl } from '../../api/client';
import type { RoomDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import NoticeDialog from '../../components/NoticeDialog';
import { Plus, Eye, Pencil, Trash2, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export default function RoomListPage({ availableOnly = false }: { availableOnly?: boolean }) {
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteRoomId, setDeleteRoomId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info'
  });
  const { hasRole } = useAuthStore();

  useEffect(() => { load(); }, [availableOnly]);

  const load = async () => {
    try {
      const res = availableOnly ? await roomApi.getAvailable() : await roomApi.getAll();
      setRooms(res.data);
    } catch { /* noop */ } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteRoomId) return;
    try {
      await roomApi.delete(deleteRoomId);
      await load();
      setNotice({ open: true, title: 'Room Deleted', message: 'Room has been deleted successfully.', variant: 'success' });
    } catch {
      setNotice({ open: true, title: 'Delete Failed', message: 'Failed to delete room.', variant: 'error' });
    } finally {
      setDeleteRoomId(null);
    }
  };

  const filtered = rooms.filter((r) =>
    r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
    (r.type || r.roomType || '').toLowerCase().includes(search.toLowerCase())
  );

  const availableCount = rooms.filter((room) => room.status === 'Available').length;
  const occupiedCount = rooms.filter((room) => room.status === 'Occupied').length;
  const averageRate = rooms.length > 0
    ? rooms.reduce((sum, room) => sum + (room.dailyRate || room.monthlyRent || 0), 0) / rooms.length
    : 0;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-7xl space-y-6">
      <div className="hero-banner">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="hero-kicker">Room inventory</span>
            <h1 className="page-title mt-4">{availableOnly ? 'Danh sach phong san sang' : 'Toan bo phong trong he thong'}</h1>
            <p className="page-subtitle">
              Quan ly ton kho phong theo phong cach booking platform: ro rang ve anh, suc chua, trang thai, gia va hanh dong tiep theo.
            </p>
          </div>
          {hasRole('Admin', 'Staff') && <Link to="/rooms/create" className="btn btn-primary"><Plus size={18} /> Them phong moi</Link>}
        </div>

        <div className="listing-summary mt-6">
          <div className="metric-card">
            <div className="metric-label">Tong phong</div>
            <div className="metric-value">{rooms.length}</div>
            <div className="metric-note">Toan bo kho phong</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Phong san sang</div>
            <div className="metric-value">{availableCount}</div>
            <div className="metric-note">Co the nhan khach ngay</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Phong dang su dung</div>
            <div className="metric-value">{occupiedCount}</div>
            <div className="metric-note">Can theo doi cong suat</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Gia trung binh</div>
            <div className="metric-value">{formatCurrency(averageRate)}</div>
            <div className="metric-note">Moi dem luu tru</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 sm:p-6">
        <div className="search-shell mb-4">
          <Search size={16} className="search-icon" />
          <input className="form-input search-input" placeholder="Tim theo so phong hoac loai phong..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? <EmptyState message="No rooms found" /> : (
          <div className="table-shell overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Hinh anh</th><th>Phong</th><th>Loai</th><th>Tang</th><th>Dien tich</th><th>Gia moi dem</th><th>Trang thai</th><th>Thao tac</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {r.imageUrl ? (
                        <img 
                          src={buildImageUrl(r.imageUrl)}
                          alt={`Room ${r.roomNumber}`}
                          style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: '1rem', boxShadow: '0 16px 34px -22px rgba(15, 23, 42, 0.45)' }}
                        />
                      ) : (
                        <div style={{ width: 56, height: 56, borderRadius: '1rem', backgroundColor: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          N/A
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{r.roomNumber}</td>
                    <td>{r.type || r.roomType}</td>
                    <td>{r.floor}</td>
                    <td>{r.area} m²</td>
                    <td>{formatCurrency(r.dailyRate || r.monthlyRent || 0)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <Link to={`/rooms/${r.id}`} className="btn btn-ghost btn-sm"><Eye size={16} /></Link>
                        {hasRole('Admin', 'Staff') && <Link to={`/rooms/${r.id}/edit`} className="btn btn-ghost btn-sm"><Pencil size={16} /></Link>}
                        {hasRole('Admin') && <button onClick={() => setDeleteRoomId(r.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>}
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
        isOpen={deleteRoomId !== null}
        title="Delete Room"
        message="Are you sure you want to delete this room? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteRoomId(null)}
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

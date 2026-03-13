import { useEffect, useState } from 'react';
import { serviceRequestApi } from '../../api/serviceRequests';
import type { ServiceRequestDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import NoticeDialog from '../../components/NoticeDialog';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function ServiceRequestListPage({ myOnly = false, pendingOnly = false }: { myOnly?: boolean; pendingOnly?: boolean }) {
  const [requests, setRequests] = useState<ServiceRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { hasRole } = useAuthStore();
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteRequestId, setDeleteRequestId] = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: 'Approved', staffFeedback: '' });
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info'
  });

  useEffect(() => { load(); }, [myOnly, pendingOnly]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (myOnly) res = await serviceRequestApi.getMyRequests();
      else if (pendingOnly) res = await serviceRequestApi.getPending();
      else res = await serviceRequestApi.getAll();
      setRequests(res.data);
    } catch (err: any) {
      const errorMsg = err.response?.status === 403 
        ? 'You do not have permission to view this data.'
        : err.message || 'Failed to load service requests.';
      setError(errorMsg);
      console.error('ServiceRequest load error:', errorMsg, err);
    } finally { 
      setLoading(false); 
    }
  };

  const handleDelete = async () => {
    if (!deleteRequestId) return;
    try {
      await serviceRequestApi.delete(deleteRequestId);
      await load();
      setNotice({ open: true, title: 'Request Deleted', message: 'Service request has been deleted.', variant: 'success' });
    } catch {
      setNotice({ open: true, title: 'Delete Failed', message: 'Failed to delete request.', variant: 'error' });
    } finally {
      setDeleteRequestId(null);
    }
  };

  const handleReview = async () => {
    if (!selectedId) return;
    try {
      await serviceRequestApi.review(selectedId, reviewForm);
      setReviewModal(false);
      await load();
      setNotice({ open: true, title: 'Request Reviewed', message: 'Service request review has been submitted.', variant: 'success' });
    } catch {
      setNotice({ open: true, title: 'Review Failed', message: 'Failed to review request.', variant: 'error' });
    }
  };

  const filtered = requests.filter((r) =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.serviceType?.toLowerCase().includes(search.toLowerCase()) ||
    r.residentName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  const title = myOnly ? 'My Service Requests' : pendingOnly ? 'Pending Requests' : 'All Service Requests';

  return (
    <div className="page-shell max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Track and process resident service requests efficiently.</p>
        </div>
        {hasRole('Resident') && <Link to="/service-requests/create" className="btn btn-primary"><Plus size={18} /> New Request</Link>}
      </div>

      {error && (
        <div className="rounded-xl border border-red-300/60 bg-red-100/70 px-4 py-3 text-sm text-red-700 dark:border-red-700/60 dark:bg-red-900/25 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="glass-card p-5 sm:p-6">
        <div className="relative mb-4">
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search..." style={{ paddingLeft: '2.25rem' }} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? <EmptyState message="No requests found" /> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Title</th><th>Type</th><th>Priority</th><th>Date</th><th>Status</th>{!myOnly && <th>Resident</th>}<th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.title}</td>
                    <td>{r.serviceType}</td>
                    <td><span className={`badge ${r.priority === 'Urgent' ? 'badge-danger' : r.priority === 'High' ? 'badge-warning' : 'badge-default'}`}>{r.priority}</span></td>
                    <td style={{ fontSize: '0.8125rem' }}>{new Date(r.requestDate).toLocaleDateString()}</td>
                    <td><StatusBadge status={r.status} /></td>
                    {!myOnly && <td>{r.residentName}</td>}
                    <td>
                      <div className="flex gap-1">
                        {hasRole('Admin', 'Staff') && r.status === 'Pending' && (
                          <button onClick={() => { setSelectedId(r.id); setReviewModal(true); }} className="btn btn-primary btn-sm">Review</button>
                        )}
                        {myOnly && r.status === 'Pending' && (
                          <button onClick={() => setDeleteRequestId(r.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Review Service Request">
        <div className="grid gap-4">
          <div><label className="form-label">Status</label>
            <select className="form-input" value={reviewForm.status} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}>
              <option>Approved</option><option>InProgress</option><option>Completed</option><option>Rejected</option>
            </select>
          </div>
          <div><label className="form-label">Feedback</label><textarea className="form-input" rows={3} value={reviewForm.staffFeedback} onChange={(e) => setReviewForm({ ...reviewForm, staffFeedback: e.target.value })} /></div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={() => setReviewModal(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleReview} className="btn btn-primary">Submit Review</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteRequestId !== null}
        title="Delete Service Request"
        message="Are you sure you want to delete this service request? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteRequestId(null)}
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

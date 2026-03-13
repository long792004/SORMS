import { useEffect, useState } from 'react';
import { reportApi } from '../../api/reports';
import type { ReportDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import NoticeDialog from '../../components/NoticeDialog';
import { Link } from 'react-router-dom';
import { Plus, Trash2, Search, Eye } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function ReportListPage({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const [reports, setReports] = useState<ReportDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { hasRole } = useAuthStore();
  const [reviewModal, setReviewModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportDto | null>(null);
  const [reviewForm, setReviewForm] = useState({ status: 'Reviewed', adminFeedback: '' });
  const [deleteReportId, setDeleteReportId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info'
  });

  useEffect(() => { load(); }, [pendingOnly]);

  const load = async () => {
    setLoading(true);
    try {
      const res = pendingOnly ? await reportApi.getPending() : await reportApi.getAll();
      setReports(res.data);
    } catch { /* noop */ } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteReportId) return;
    try {
      await reportApi.delete(deleteReportId);
      await load();
      setNotice({ open: true, title: 'Report Deleted', message: 'Report has been deleted successfully.', variant: 'success' });
    } catch {
      setNotice({ open: true, title: 'Delete Failed', message: 'Failed to delete report.', variant: 'error' });
    } finally {
      setDeleteReportId(null);
    }
  };

  const handleReview = async () => {
    if (!selectedReport) return;
    try {
      await reportApi.review(selectedReport.id, reviewForm);
      setReviewModal(false);
      await load();
      setNotice({ open: true, title: 'Report Reviewed', message: 'Report review has been submitted.', variant: 'success' });
    } catch {
      setNotice({ open: true, title: 'Review Failed', message: 'Failed to review report.', variant: 'error' });
    }
  };

  const filtered = reports.filter((r) =>
    r.title?.toLowerCase().includes(search.toLowerCase()) ||
    r.createdBy?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{pendingOnly ? 'Pending Reports' : 'All Reports'}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Review and manage report lifecycle across the system.</p>
        </div>
        {hasRole('Staff') && <Link to="/reports/create" className="btn btn-primary"><Plus size={18} /> New Report</Link>}
      </div>

      <div className="glass-card p-5 sm:p-6">
        <div className="relative mb-4">
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--text-muted)' }} />
          <input className="form-input" placeholder="Search..." style={{ paddingLeft: '2.25rem' }} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? <EmptyState message="No reports found" /> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Title</th><th>Created By</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 500 }}>{r.title}</td>
                    <td>{r.createdBy}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{new Date(r.generatedDate).toLocaleDateString()}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => { setSelectedReport(r); setDetailModal(true); }} className="btn btn-ghost btn-sm"><Eye size={16} /></button>
                        {hasRole('Admin') && r.status === 'Pending' && (
                          <button onClick={() => { setSelectedReport(r); setReviewModal(true); }} className="btn btn-primary btn-sm">Review</button>
                        )}
                        {hasRole('Staff') && <button onClick={() => setDeleteReportId(r.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }}><Trash2 size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title={selectedReport?.title || 'Report Detail'} maxWidth={600}>
        {selectedReport && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Content</p><p style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>{selectedReport.content}</p></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created By</p><p>{selectedReport.createdBy}</p></div>
              <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</p><StatusBadge status={selectedReport.status} /></div>
            </div>
            {selectedReport.adminFeedback && <div><p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Admin Feedback</p><p style={{ fontSize: '0.875rem' }}>{selectedReport.adminFeedback}</p></div>}
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={reviewModal} onClose={() => setReviewModal(false)} title="Review Report">
        <div className="grid gap-4">
          <div><label className="form-label">Status</label>
            <select className="form-input" value={reviewForm.status} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}>
              <option>Reviewed</option><option>Rejected</option>
            </select>
          </div>
          <div><label className="form-label">Feedback</label><textarea className="form-input" rows={3} value={reviewForm.adminFeedback} onChange={(e) => setReviewForm({ ...reviewForm, adminFeedback: e.target.value })} /></div>
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={() => setReviewModal(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleReview} className="btn btn-primary">Submit</button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteReportId !== null}
        title="Delete Report"
        message="Are you sure you want to delete this report? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteReportId(null)}
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

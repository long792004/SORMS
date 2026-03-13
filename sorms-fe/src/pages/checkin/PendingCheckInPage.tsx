import { useCallback, useEffect, useState } from 'react';
import { checkInApi } from '../../api/checkin';
import { paymentApi } from '../../api/payment';
import type { CheckInRecordDto, InvoiceDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import NoticeDialog from '../../components/NoticeDialog';
import { Check, X, AlertCircle } from 'lucide-react';

export default function PendingCheckInPage({ type = 'checkin' }: { type?: 'checkin' | 'checkout' }) {
  const [records, setRecords] = useState<CheckInRecordDto[]>([]);
  const [invoices, setInvoices] = useState<Record<number, InvoiceDto>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info'
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = type === 'checkin' ? await checkInApi.getPendingCheckIn() : await checkInApi.getPendingCheckOut();
      const pendingRecords = res.data?.data || [];
      setRecords(pendingRecords);
      
      // Fetch invoice status for each check-in request
      if (type === 'checkin') {
        const invoiceMap: Record<number, InvoiceDto> = {};
        try {
          const invoiceRes = await paymentApi.getAllInvoices(1, 1000);
          const allInvoices = invoiceRes.data || [];

          for (const record of pendingRecords) {
            const roomInvoice = allInvoices
              .filter((inv: InvoiceDto) =>
                inv.residentId === record.residentId &&
                inv.roomId === record.roomId &&
                (inv.status === 'Pending' || inv.status === 'Created' || inv.status === 'Paid'))
              .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];

            if (roomInvoice) {
              invoiceMap[record.id] = roomInvoice;
            }
          }
        } catch (err) {
          console.warn('Failed to fetch invoices for pending check-in records:', err);
        }

        setInvoices(invoiceMap);
      }
    } catch (err: unknown) {
      const statusCode = typeof err === 'object' && err !== null && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined;
      const errorMsg = statusCode === 403 
        ? 'You do not have permission to view pending requests.'
        : err instanceof Error ? err.message : 'Failed to load pending requests.';
      setError(errorMsg);
      console.error('Load pending check-in error:', errorMsg, err);
    } finally { 
      setLoading(false); 
    }
  }, [type]);

  useEffect(() => {
    void load();

    const intervalId = window.setInterval(() => {
      void load();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [load]);

  const handleApprove = async (id: number) => {
    // Check if payment is completed before approving check-in
    if (type === 'checkin' && invoices[id]?.status !== 'Paid') {
      setNotice({
        open: true,
        title: 'Payment Required',
        message: 'Payment must be completed before approving check-in.',
        variant: 'warning'
      });
      return;
    }
    
    setApprovingId(id);
    try {
      const fn = type === 'checkin' ? checkInApi.approveCheckIn : checkInApi.approveCheckOut;
      await fn({ requestId: id, isApproved: true });
      await load();
      setNotice({ open: true, title: 'Request Approved', message: 'Request has been approved successfully.', variant: 'success' });
    } catch {
      setNotice({ open: true, title: 'Approve Failed', message: 'Failed to approve request.', variant: 'error' });
    } finally { setApprovingId(null); }
  };

  const handleReject = async () => {
    if (!selectedId) return;
    try {
      const fn = type === 'checkin' ? checkInApi.approveCheckIn : checkInApi.approveCheckOut;
      await fn({ requestId: selectedId, isApproved: false, rejectReason });
      setShowRejectModal(false); setRejectReason('');
      await load();
      setNotice({ open: true, title: 'Request Rejected', message: 'Request has been rejected successfully.', variant: 'success' });
    } catch {
      setNotice({ open: true, title: 'Reject Failed', message: 'Failed to reject request.', variant: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-7xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">
        Pending {type === 'checkin' ? 'Check-In' : 'Check-Out'} Requests
      </h1>
      {error && (
        <div className="rounded-xl border border-red-300/60 bg-red-100/70 px-4 py-3 text-sm text-red-700 dark:border-red-700/60 dark:bg-red-900/25 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="glass-card p-5 sm:p-6">
        {records.length === 0 ? <EmptyState message="No pending requests" /> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Room</th>
                  <th>Booking Window</th>
                  <th>Request Time</th>
                  <th>Booking Status</th>
                  {type === 'checkin' && <th>Payment</th>}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const invoice = invoices[r.id];
                  const paymentCompleted = !invoice || invoice.status === 'Paid';
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.residentName}</td>
                      <td>{r.roomNumber}</td>
                      <td>
                        {new Date(r.expectedCheckInDate).toLocaleDateString()} - {new Date(r.expectedCheckOutDate).toLocaleDateString()}
                      </td>
                      <td>{new Date(r.requestTime).toLocaleString()}</td>
                      <td><StatusBadge status={r.bookingStatus || r.status} /></td>
                      {type === 'checkin' && (
                        <td>
                          {invoice ? (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              backgroundColor: invoice.status === 'Paid' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: invoice.status === 'Paid' ? '#10b981' : '#ef4444'
                            }}>
                              {invoice.status}
                            </span>
                          ) : (
                            <span style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              backgroundColor: 'rgba(156,163,175,0.1)',
                              color: '#6b7280'
                            }}>
                              No Invoice
                            </span>
                          )}
                        </td>
                      )}
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => handleApprove(r.id)} 
                            className="btn btn-success btn-sm" 
                            disabled={!paymentCompleted || approvingId === r.id}
                            title={!paymentCompleted ? 'Payment required before approval' : ''}
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button 
                            onClick={() => { setSelectedId(r.id); setShowRejectModal(true); }} 
                            className="btn btn-danger btn-sm"
                          >
                            <X size={16} /> Reject
                          </button>
                          {type === 'checkin' && !paymentCompleted && (
                            <span title="Payment required" style={{ color: '#ef4444', marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <AlertCircle size={14} />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Request" maxWidth={720}>
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-[rgba(217,119,6,0.2)] bg-[radial-gradient(circle_at_top_right,_rgba(217,119,6,0.12),_transparent_30%),linear-gradient(145deg,rgba(255,249,242,0.92),rgba(255,255,255,0.82))] p-4 dark:border-[rgba(217,119,6,0.18)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(217,119,6,0.12),_transparent_30%),linear-gradient(145deg,rgba(20,30,37,0.94),rgba(11,24,31,0.92))]">
            <p className="text-sm leading-6 text-[var(--text-secondary)]">
              Provide a short reason so the resident can understand why this request was not approved.
            </p>
          </div>

          <div>
            <label className="form-label">Reject Reason</label>
            <textarea
              className="form-input min-h-[140px] resize-y"
              rows={5}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason..."
            />
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button onClick={() => setShowRejectModal(false)} className="btn btn-secondary w-full sm:w-auto">Cancel</button>
            <button onClick={handleReject} className="btn btn-danger w-full sm:w-auto">Reject</button>
          </div>
        </div>
      </Modal>

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

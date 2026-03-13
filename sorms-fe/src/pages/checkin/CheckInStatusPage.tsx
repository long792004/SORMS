import { useEffect, useState } from 'react';
import { checkInApi } from '../../api/checkin';
import type { CheckInRecordDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import ConfirmDialog from '../../components/ConfirmDialog';
import { LogOut, XCircle } from 'lucide-react';

export default function CheckInStatusPage() {
  const [status, setStatus] = useState<CheckInRecordDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [confirmAction, setConfirmAction] = useState<'checkout' | 'cancel-checkin' | null>(null);

  useEffect(() => {
    checkInApi.getMyStatus().then((r) => setStatus(r.data?.data || null)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleCheckOut = async () => {
    if (!status) return;
    setSubmitting(true); setMsg('');
    try {
      await checkInApi.requestCheckOut({ checkInRecordId: status.id });
      setMsg('Check-out request submitted!');
      checkInApi.getMyStatus().then((r) => setStatus(r.data?.data || null));
    } catch (err: unknown) {
      const errorMessage =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setMsg(errorMessage || 'Failed.');
    } finally { setSubmitting(false); }
  };

  const handleCancelCheckIn = async () => {
    if (!status) return;
    setSubmitting(true); setMsg('');
    try {
      await checkInApi.cancelCheckIn({ checkInRecordId: status.id });
      setMsg('Booking request cancelled.');
      const response = await checkInApi.getMyStatus();
      setStatus(response.data?.data || null);
    } catch (err: unknown) {
      const errorMessage =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setMsg(errorMessage || 'Failed.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner />;

  const statusValue = status?.bookingStatus || status?.status || 'Pending';

  return (
    <div className="page-shell max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">My Check-In Status</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Track current booking and request check-out when needed.</p>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-300/50 bg-emerald-100/70 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-200">
          {msg}
        </div>
      )}

      {!status ? (
        <div className="glass-card rounded-2xl p-8 text-center text-[var(--text-muted)]">
          You are not currently checked in to any room.
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 sm:p-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Room</p>
              <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{status.roomNumber}</p>
            </div>

            <div className="rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Status</p>
              <div className="mt-1">
                <StatusBadge status={statusValue} />
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Request Time</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{new Date(status.requestTime).toLocaleString()}</p>
            </div>

            <div className="rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Check-In Time</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{status.checkInTime ? new Date(status.checkInTime).toLocaleString() : '—'}</p>
            </div>

            <div className="rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Expected Check-In</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{new Date(status.expectedCheckInDate).toLocaleDateString()}</p>
            </div>

            <div className="rounded-xl border border-[var(--border-color)]/60 bg-[var(--bg-secondary)]/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">Expected Check-Out</p>
              <p className="mt-1 text-sm text-[var(--text-primary)]">{new Date(status.expectedCheckOutDate).toLocaleDateString()}</p>
            </div>

            {status.rejectReason && (
              <div className="sm:col-span-2 rounded-xl border border-red-300/60 bg-red-100/60 p-4 dark:border-red-700/60 dark:bg-red-900/25">
                <p className="text-xs font-medium uppercase tracking-wide text-red-700 dark:text-red-300">Reject Reason</p>
                <p className="mt-1 text-sm text-red-700 dark:text-red-200">{status.rejectReason}</p>
              </div>
            )}
          </div>

          {status.status === 'PendingCheckIn' && (
            <button onClick={() => setConfirmAction('cancel-checkin')} className="btn btn-danger mt-5 w-full" disabled={submitting}>
              <XCircle size={18} /> {submitting ? 'Cancelling...' : 'Cancel Booking Request'}
            </button>
          )}

          {status.status === 'CheckedIn' && (
            <button onClick={() => setConfirmAction('checkout')} className="btn btn-danger mt-5 w-full" disabled={submitting}>
              <LogOut size={18} /> {submitting ? 'Requesting...' : 'Request Check-Out'}
            </button>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmAction === 'checkout'}
        title="Request Check-Out"
        message="Are you sure you want to submit a check-out request? Staff will review this request before finalizing your check-out."
        confirmText="Yes, request check-out"
        cancelText="Keep staying"
        variant="warning"
        loading={submitting}
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          await handleCheckOut();
          setConfirmAction(null);
        }}
      />

      <ConfirmDialog
        isOpen={confirmAction === 'cancel-checkin'}
        title="Cancel Booking Request"
        message="Are you sure you want to cancel this pending booking request? This action cannot be undone."
        confirmText="Yes, cancel booking"
        cancelText="Back"
        variant="danger"
        loading={submitting}
        onCancel={() => setConfirmAction(null)}
        onConfirm={async () => {
          await handleCancelCheckIn();
          setConfirmAction(null);
        }}
      />
    </div>
  );
}

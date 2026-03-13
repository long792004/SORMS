import { useEffect, useState } from 'react';
import { checkInApi } from '../../api/checkin';
import type { CheckInRecordDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';

export default function CheckInHistoryPage() {
  const [records, setRecords] = useState<CheckInRecordDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkInApi.getMyHistory().then((r) => setRecords(r.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-7xl space-y-5">
      <div className="page-header">
        <h1 className="page-title">My Check-In History</h1>
        <p className="page-subtitle">Review your full check-in and check-out timeline.</p>
      </div>

      <div className="glass-card panel">
        {records.length === 0 ? <EmptyState message="No history found" /> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Room</th><th>Booking Window</th><th>Request Time</th><th>Check-In</th><th>Check-Out</th><th>Booking Status</th></tr></thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.roomNumber}</td>
                    <td>{new Date(r.expectedCheckInDate).toLocaleDateString()} - {new Date(r.expectedCheckOutDate).toLocaleDateString()}</td>
                    <td>{new Date(r.requestTime).toLocaleString()}</td>
                    <td>{r.checkInTime ? new Date(r.checkInTime).toLocaleString() : '—'}</td>
                    <td>{r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : '—'}</td>
                    <td><StatusBadge status={r.bookingStatus || r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

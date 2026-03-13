import { useEffect, useState } from 'react';
import { checkInApi } from '../../api/checkin';
import type { CheckInRecordDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { Search } from 'lucide-react';

export default function CheckInRecordsPage() {
  const [records, setRecords] = useState<CheckInRecordDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    checkInApi.getAll().then((r) => setRecords(r.data?.data || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = records.filter((r) =>
    r.residentName?.toLowerCase().includes(search.toLowerCase()) ||
    r.roomNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-7xl space-y-5">
      <div className="page-header">
        <h1 className="page-title">All Check-In Records</h1>
        <p className="page-subtitle">Track booking windows and lifecycle status across all records.</p>
      </div>

      <div className="glass-card panel">
        <div className="search-shell">
          <Search size={16} className="search-icon" />
          <input className="form-input search-input" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {filtered.length === 0 ? <EmptyState message="No records found" /> : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Resident</th><th>Room</th><th>Booking Window</th><th>Request</th><th>Check-In</th><th>Check-Out</th><th>Booking Status</th><th>Approved By</th></tr></thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.residentName}</td>
                    <td>{r.roomNumber}</td>
                    <td className="text-xs">{new Date(r.expectedCheckInDate).toLocaleDateString()} - {new Date(r.expectedCheckOutDate).toLocaleDateString()}</td>
                    <td className="text-xs">{new Date(r.requestTime).toLocaleString()}</td>
                    <td className="text-xs">{r.checkInTime ? new Date(r.checkInTime).toLocaleString() : '—'}</td>
                    <td className="text-xs">{r.checkOutTime ? new Date(r.checkOutTime).toLocaleString() : '—'}</td>
                    <td><StatusBadge status={r.bookingStatus || r.status} /></td>
                    <td>{r.approvedByName || '—'}</td>
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

interface StatusBadgeProps {
  status: string;
}

const statusMap: Record<string, { className: string; label: string }> = {
  // Check-in statuses
  PendingCheckIn: { className: 'badge-warning', label: 'Pending check-in' },
  CheckedIn: { className: 'badge-success', label: 'Checked in' },
  PendingCheckOut: { className: 'badge-warning', label: 'Pending check-out' },
  CheckedOut: { className: 'badge-info', label: 'Checked out' },
  Rejected: { className: 'badge-danger', label: 'Rejected' },
  Cancelled: { className: 'badge-danger', label: 'Cancelled' },
  Confirmed: { className: 'badge-success', label: 'Confirmed' },
  'Checked-in': { className: 'badge-success', label: 'Checked in' },
  'Checked-out': { className: 'badge-info', label: 'Checked out' },
  // Service request statuses
  Pending: { className: 'badge-warning', label: 'Pending' },
  Approved: { className: 'badge-success', label: 'Approved' },
  InProgress: { className: 'badge-info', label: 'In progress' },
  Completed: { className: 'badge-success', label: 'Completed' },
  // Report statuses
  Reviewed: { className: 'badge-success', label: 'Reviewed' },
  // Room statuses
  Available: { className: 'badge-success', label: 'Available' },
  Occupied: { className: 'badge-warning', label: 'Occupied' },
  Maintenance: { className: 'badge-danger', label: 'Maintenance' },
  // Active
  Active: { className: 'badge-success', label: 'Active' },
  Inactive: { className: 'badge-danger', label: 'Inactive' },
  Paid: { className: 'badge-success', label: 'Paid' },
  Unpaid: { className: 'badge-warning', label: 'Unpaid' },
  Failed: { className: 'badge-danger', label: 'Failed' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const mapped = statusMap[status] || { className: 'badge-default', label: status };
  return <span className={`badge ${mapped.className}`}>{mapped.label}</span>;
}

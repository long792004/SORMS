import { useEffect, useState } from 'react';
import { roomApi } from '../../api/rooms';
import { checkInApi } from '../../api/checkin';
import { paymentApi } from '../../api/payment';
import type { RoomDto, InvoiceDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import CheckInPaymentModal from '../../components/CheckInPaymentModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { DoorOpen, LogIn } from 'lucide-react';

export default function RequestCheckInPage() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateLoading, setDateLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceDto | null>(null);
  const [pendingRoomId, setPendingRoomId] = useState<number | null>(null);
  const [checkInDate, setCheckInDate] = useState(formatDate(today));
  const [checkOutDate, setCheckOutDate] = useState(formatDate(tomorrow));
  const [numberOfResidents, setNumberOfResidents] = useState(1);

  const numberOfNights = checkInDate && checkOutDate
    ? Math.max(0, Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  useEffect(() => {
    loadAvailableRooms(true);
  }, []);

  useEffect(() => {
    if (!checkInDate || !checkOutDate) return;
    loadAvailableRooms(false);
  }, [checkInDate, checkOutDate]);

  const loadAvailableRooms = async (isInitialLoad: boolean) => {
    if (checkOutDate <= checkInDate) {
      setRooms([]);
      if (!isInitialLoad) {
        setError('Check-out must be later than check-in.');
      }
      setLoading(false);
      return;
    }

    if (isInitialLoad) {
      setLoading(true);
    } else {
      setDateLoading(true);
    }

    try {
      setError('');
      const response = await roomApi.getAvailable({ checkIn: checkInDate, checkOut: checkOutDate });
      setRooms(response.data);
    } catch {
      setError('Unable to load available rooms for the selected dates.');
    } finally {
      setLoading(false);
      setDateLoading(false);
    }
  };

  const submitCheckIn = async (roomId: number) => {
    if (!checkInDate || !checkOutDate) {
      setError('Please choose both a check-in date and a check-out date.');
      return;
    }

    if (checkOutDate <= checkInDate) {
      setError('Check-out must be later than check-in.');
      return;
    }

    const selectedRoom = rooms.find((room) => room.id === roomId);
    if (!selectedRoom) {
      setError('The selected room could not be found. Please refresh the page.');
      return;
    }

    if (numberOfResidents > (selectedRoom.maxCapacity || 1)) {
      setError(`Guest count cannot exceed the room capacity (${selectedRoom.maxCapacity || 1}).`);
      return;
    }

    setSubmitting(true); 
    setError(''); 
    setSuccess('');
    const requestStartedAt = Date.now();
    try {
      // Step 1: Request check-in first
      const checkInRes = await checkInApi.requestCheckIn({
        roomId,
        checkInDate,
        checkOutDate,
        numberOfResidents,
      });
      
      if (!checkInRes.data?.success) {
        setError(checkInRes.data?.message || 'Failed to submit check-in request');
        setSubmitting(false);
        return;
      }

  setSuccess('Your check-in request has been submitted.');

      // Step 2: Reload rooms to update status
      try {
        const newRoomsList = await roomApi.getAvailable({ checkIn: checkInDate, checkOut: checkOutDate });
        setRooms(newRoomsList.data);
      } catch { /* noop */ }

      // Step 3: Try to fetch the newest invoice for this booking
      try {
        const invoicesRes = await paymentApi.getMyInvoices();
        const roomInvoice = [...(invoicesRes.data || [])]
          .filter((inv: InvoiceDto) =>
            inv.roomId === roomId &&
            (inv.status === 'Pending' || inv.status === 'Created') &&
            new Date(inv.createdAt).getTime() >= requestStartedAt - 5000
          )
          .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];
        
        if (roomInvoice) {
          setCurrentInvoice(roomInvoice);
          setShowPaymentModal(true);
          setSuccess('Your booking request has been submitted. Please complete payment to continue.');
        }
      } catch { /* noop - payment is optional */ }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to request check-in';
      setError(errorMsg);
      console.error('Check-in error:', err);
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleCheckIn = async (roomId: number) => {
    setPendingRoomId(roomId);
  };

  const confirmCheckIn = async () => {
    if (!pendingRoomId) return;
    const selectedRoomId = pendingRoomId;
    setPendingRoomId(null);
    await submitCheckIn(selectedRoomId);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setSuccess('Payment received. Your check-in is now waiting for staff approval.');
    const newRoomsList = await roomApi.getAvailable({ checkIn: checkInDate, checkOut: checkOutDate });
    setRooms(newRoomsList.data);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-7xl space-y-5">
      <div className="page-header">
        <h1 className="page-title">Request Check-In</h1>
        <p className="page-subtitle">Choose dates, review room details clearly, and submit your booking request.</p>
      </div>

      <div className="glass-card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="form-label">Check-in Date</label>
            <input
              type="date"
              className="form-input"
              value={checkInDate}
              min={formatDate(today)}
              onChange={(event) => setCheckInDate(event.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Check-out Date</label>
            <input
              type="date"
              className="form-input"
              value={checkOutDate}
              min={checkInDate || formatDate(today)}
              onChange={(event) => setCheckOutDate(event.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Number of Residents</label>
            <input
              type="number"
              min={1}
              className="form-input"
              value={numberOfResidents}
              onChange={(event) => setNumberOfResidents(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>
        </div>
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}
      {success && <div className="alert-banner alert-success">{success}</div>}
      {dateLoading && <LoadingSpinner text="Checking room availability..." />}

      {rooms.length === 0 ? <EmptyState message="No rooms available" /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((r) => {
            const exceedsCapacity = numberOfResidents > (r.maxCapacity || 1);
            return (
            <div key={r.id} className="glass-card p-5" style={{ opacity: exceedsCapacity ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              <div className="mb-4 flex items-center gap-3">
                <div className="gradient-secondary flex h-10 w-10 items-center justify-center rounded-lg text-white"><DoorOpen size={20} /></div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">Room {r.roomNumber}</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    {r.type || r.roomType} • Floor {r.floor} • 
                    <span className="ml-1 font-semibold text-emerald-500">Available</span>
                  </p>
                </div>
              </div>
              <div className="mb-4 space-y-1 text-sm text-[var(--text-secondary)]">
                <p>{r.area} m² • {formatCurrency(r.dailyRate || r.monthlyRent || 0)}/day</p>
                <p>
                  Estimated stay cost: {formatCurrency((r.dailyRate || r.monthlyRent || 0) * numberOfNights)} for {numberOfNights} night(s)
                </p>
                <p>Max capacity: {r.maxCapacity || 1} residents</p>
                {r.description && <p>{r.description}</p>}
                {exceedsCapacity && (
                  <p className="font-medium text-red-500">
                    Guest count exceeds the maximum room capacity.
                  </p>
                )}
              </div>
              <button onClick={() => handleCheckIn(r.id)} className="btn btn-primary btn-sm w-full" disabled={submitting || exceedsCapacity}>
                <LogIn size={16} /> Request Check-In
              </button>
            </div>
            );
          })}
        </div>
      )}
      <CheckInPaymentModal 
        isOpen={showPaymentModal} 
        invoice={currentInvoice} 
        onPaymentSuccess={handlePaymentSuccess} 
        onCancel={() => setShowPaymentModal(false)} 
      />

      <ConfirmDialog
        isOpen={pendingRoomId !== null}
        title="Submit Check-In Request"
        message="Do you want to submit this check-in request for the selected room and dates?"
        confirmText="Yes, submit"
        cancelText="Cancel"
        variant="default"
        onConfirm={confirmCheckIn}
        onCancel={() => setPendingRoomId(null)}
      />
    </div>
  );
}

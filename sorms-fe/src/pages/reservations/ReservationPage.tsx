import { useEffect, useMemo, useState } from 'react';
import { reservationApi } from '../../api/reservation';
import { roomApi } from '../../api/rooms';
import type { CreateReservationRequest, ReservationDto, RoomDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import NoticeDialog from '../../components/NoticeDialog';
import StatusBadge from '../../components/StatusBadge';

interface Props {
  adminView?: boolean;
}

const emptyGuest = { fullName: '', identityNumber: '', phone: '' };

export default function ReservationPage({ adminView = false }: Props) {
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [reservations, setReservations] = useState<ReservationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateReservationRequest>({
    roomId: 0,
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: 1,
    guests: [{ ...emptyGuest }],
  });
  const [notice, setNotice] = useState<{ open: boolean; title: string; message: string; variant: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    title: '',
    message: '',
    variant: 'info',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [roomRes, reservationRes] = await Promise.all([
        roomApi.getAvailable(),
        adminView ? reservationApi.getAll() : reservationApi.getMyReservations(),
      ]);
      setRooms(roomRes.data || []);
      setReservations(reservationRes.data.data || []);
    } catch (error) {
      setNotice({ open: true, title: 'Load failed', message: 'Cannot load reservation data.', variant: 'error' });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [adminView]);

  const canSubmit = useMemo(() => {
    if (!form.roomId || !form.checkInDate || !form.checkOutDate) return false;
    if (form.numberOfGuests <= 0 || form.guests.length !== form.numberOfGuests) return false;
    return form.guests.every((g) => g.fullName.trim() && g.identityNumber.trim() && g.phone.trim());
  }, [form]);

  const updateGuestCount = (count: number) => {
    const normalized = Math.max(1, count);
    const next = [...form.guests];
    if (next.length < normalized) {
      while (next.length < normalized) next.push({ ...emptyGuest });
    } else if (next.length > normalized) {
      next.length = normalized;
    }
    setForm((prev) => ({ ...prev, numberOfGuests: normalized, guests: next }));
  };

  const updateGuest = (index: number, field: 'fullName' | 'identityNumber' | 'phone', value: string) => {
    const next = form.guests.map((guest, i) => (i === index ? { ...guest, [field]: value } : guest));
    setForm((prev) => ({ ...prev, guests: next }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setNotice({ open: true, title: 'Invalid form', message: 'Please fill all reservation fields.', variant: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await reservationApi.create(form);
      setNotice({ open: true, title: 'Reservation created', message: 'Reservation has been held for 15 minutes. Complete payment to confirm.', variant: 'success' });
      setForm({ roomId: 0, checkInDate: '', checkOutDate: '', numberOfGuests: 1, guests: [{ ...emptyGuest }] });
      await load();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Cannot create reservation.';
      setNotice({ open: true, title: 'Create failed', message, variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelReservation = async (id: number) => {
    try {
      await reservationApi.cancel(id, { reason: 'Cancelled from frontend' });
      await load();
    } catch (error: any) {
      setNotice({ open: true, title: 'Cancel failed', message: error?.response?.data?.message || 'Cannot cancel reservation.', variant: 'error' });
    }
  };

  const confirmReservationPayment = async (id: number) => {
    const value = window.prompt('Enter PayOS order code for confirmation:');
    if (!value) return;

    const orderCode = Number(value);
    if (!Number.isFinite(orderCode) || orderCode <= 0) {
      setNotice({ open: true, title: 'Invalid order code', message: 'Please enter a valid numeric order code.', variant: 'warning' });
      return;
    }

    try {
      await reservationApi.confirmPayment(id, { orderCode });
      setNotice({ open: true, title: 'Payment confirmed', message: 'Reservation payment has been confirmed.', variant: 'success' });
      await load();
    } catch (error: any) {
      setNotice({ open: true, title: 'Confirm failed', message: error?.response?.data?.message || 'Cannot confirm payment.', variant: 'error' });
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="page-shell max-w-7xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">{adminView ? 'All Reservations' : 'My Reservations'}</h1>

      {!adminView && (
        <form className="glass-card p-5 sm:p-6 space-y-4" onSubmit={submit}>
          <h2 className="text-lg font-semibold">Create Reservation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select className="form-input" value={form.roomId} onChange={(e) => setForm((prev) => ({ ...prev, roomId: Number(e.target.value) }))}>
              <option value={0}>Select room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>{room.roomNumber} - max {room.maxCapacity} guests</option>
              ))}
            </select>
            <input className="form-input" type="number" min={1} max={20} value={form.numberOfGuests} onChange={(e) => updateGuestCount(Number(e.target.value))} placeholder="Number of guests" />
            <input className="form-input" type="date" value={form.checkInDate} onChange={(e) => setForm((prev) => ({ ...prev, checkInDate: e.target.value }))} />
            <input className="form-input" type="date" value={form.checkOutDate} onChange={(e) => setForm((prev) => ({ ...prev, checkOutDate: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Guest details (CCCD required)</h3>
            {form.guests.map((guest, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input className="form-input" placeholder="Full name" value={guest.fullName} onChange={(e) => updateGuest(idx, 'fullName', e.target.value)} />
                <input className="form-input" placeholder="Identity number" value={guest.identityNumber} onChange={(e) => updateGuest(idx, 'identityNumber', e.target.value)} />
                <input className="form-input" placeholder="Phone" value={guest.phone} onChange={(e) => updateGuest(idx, 'phone', e.target.value)} />
              </div>
            ))}
          </div>

          <button type="submit" className="btn btn-primary" disabled={!canSubmit || submitting}>
            {submitting ? 'Creating...' : 'Create Reservation'}
          </button>
        </form>
      )}

      <div className="glass-card p-5 sm:p-6">
        {reservations.length === 0 ? (
          <EmptyState message="No reservation data" />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Resident</th>
                  <th>Room</th>
                  <th>Date</th>
                  <th>Guests</th>
                  <th>Status</th>
                  <th>Hold expires</th>
                  {!adminView && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => (
                  <tr key={reservation.id}>
                    <td>{reservation.id}</td>
                    <td>{reservation.residentName}</td>
                    <td>{reservation.roomNumber}</td>
                    <td>{new Date(reservation.checkInDate).toLocaleDateString()} - {new Date(reservation.checkOutDate).toLocaleDateString()}</td>
                    <td>{reservation.numberOfGuests}</td>
                    <td><StatusBadge status={reservation.status} /></td>
                    <td>{new Date(reservation.holdExpiresAt).toLocaleString()}</td>
                    {!adminView && (
                      <td>
                        {reservation.status === 'Held' && (
                          <div className="flex flex-wrap gap-2">
                            <button className="btn btn-secondary btn-sm" onClick={() => confirmReservationPayment(reservation.id)}>Confirm Payment</button>
                            <button className="btn btn-danger btn-sm" onClick={() => cancelReservation(reservation.id)}>Cancel</button>
                          </div>
                        )}
                        {reservation.status === 'Confirmed' && (
                          <button className="btn btn-danger btn-sm" onClick={() => cancelReservation(reservation.id)}>Cancel</button>
                        )}
                        {reservation.status !== 'Held' && reservation.status !== 'Confirmed' && '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

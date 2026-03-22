import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BedDouble,
  CalendarClock,
  CircleDollarSign,
  Clock,
  ConciergeBell,
  DoorClosed,
  DoorOpen,
  FileText,
  Sparkles,
  Users,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import StatsCard from '../../components/StatsCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { residentApi } from '../../api/residents';
import { roomApi } from '../../api/rooms';
import { serviceRequestApi } from '../../api/serviceRequests';
import { checkInApi } from '../../api/checkin';
import type { ResidentDto, RoomDto, ServiceRequestDto } from '../../types';
import { useAuthStore } from '../../store/authStore';

const COLORS = ['#155e63', '#1f8b8f', '#0ea5a8', '#c56e16', '#15803d', '#b91c1c'];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export default function DashboardPage() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const { isResident } = useAuthStore();
  const residentDashboard = isResident();

  const [loading, setLoading] = useState(true);
  const [residents, setResidents] = useState<ResidentDto[]>([]);
  const [rooms, setRooms] = useState<RoomDto[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequestDto[]>([]);
  const [pendingCheckIns, setPendingCheckIns] = useState(0);
  const [residentCheckInDate, setResidentCheckInDate] = useState(formatDate(today));
  const [residentCheckOutDate, setResidentCheckOutDate] = useState(formatDate(tomorrow));
  const [residentAvailableRooms, setResidentAvailableRooms] = useState<RoomDto[]>([]);
  const [residentRoomError, setResidentRoomError] = useState('');
  const [residentRoomsLoading, setResidentRoomsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [resRes, roomRes, srRes, ciRes] = await Promise.allSettled([
        residentApi.getAll(),
        roomApi.getAll(),
        serviceRequestApi.getAll(),
        checkInApi.getPendingCheckIn(),
      ]);

      if (resRes.status === 'fulfilled') setResidents(resRes.value.data);
      if (roomRes.status === 'fulfilled') setRooms(roomRes.value.data);
      if (srRes.status === 'fulfilled') setServiceRequests(srRes.value.data);
      if (ciRes.status === 'fulfilled') setPendingCheckIns(ciRes.value.data?.data?.length || 0);
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, []);

  const loadResidentRooms = useCallback(async (initialLoad: boolean) => {
    if (!residentCheckInDate || !residentCheckOutDate) return;

    if (residentCheckOutDate <= residentCheckInDate) {
      setResidentRoomError('Check-out must be later than check-in.');
      setResidentAvailableRooms([]);
      setResidentRoomsLoading(false);
      return;
    }

    if (initialLoad) {
      setResidentRoomsLoading(true);
    }

    try {
      setResidentRoomError('');
      const response = await roomApi.getAvailable({
        checkIn: residentCheckInDate,
        checkOut: residentCheckOutDate,
      });
      setResidentAvailableRooms(response.data);
    } catch {
      setResidentRoomError('Unable to load available rooms for the selected dates.');
      setResidentAvailableRooms([]);
    } finally {
      setResidentRoomsLoading(false);
    }
  }, [residentCheckInDate, residentCheckOutDate]);

  useEffect(() => {
    if (residentDashboard) {
      loadResidentRooms(true);
      setLoading(false);
      return;
    }

    loadData();
  }, [residentDashboard, loadData, loadResidentRooms]);

  useEffect(() => {
    if (!residentDashboard) return;
    loadResidentRooms(false);
  }, [residentCheckInDate, residentCheckOutDate, residentDashboard, loadResidentRooms]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  if (residentDashboard) {
    const availableRoomCount = residentAvailableRooms.length;
    const averageRoomRate = availableRoomCount > 0
      ? residentAvailableRooms.reduce((sum, room) => sum + (room.dailyRate || room.monthlyRent || 0), 0) / availableRoomCount
      : 0;
    const maxCapacity = residentAvailableRooms.reduce((max, room) => Math.max(max, room.maxCapacity || 1), 1);

    return (
      <div className="page-shell max-w-7xl space-y-6">
        <div className="hero-banner">
          <div className="hero-grid">
            <div>
              <span className="hero-kicker">
                <Sparkles size={14} />
                Resident booking view
              </span>
              <div className="page-header mt-5">
                <h1 className="page-title">Find the right room for your next stay</h1>
                <p className="page-subtitle">
                  Compare availability, nightly rate, capacity, and booking timing before you move into the check-in flow.
                </p>
              </div>
              <div className="listing-summary mt-6">
                <div className="metric-card">
                  <div className="metric-label">Available rooms</div>
                  <div className="metric-value">{availableRoomCount}</div>
                  <div className="metric-note">Updated for your selected dates</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Average nightly rate</div>
                  <div className="metric-value">{formatCurrency(averageRoomRate || 0)}</div>
                  <div className="metric-note">Per night</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Max capacity</div>
                  <div className="metric-value">{maxCapacity}</div>
                  <div className="metric-note">Guests per room in this result set</div>
                </div>
                <div className="metric-card">
                  <div className="metric-label">Check-in</div>
                  <div className="metric-value" style={{ fontSize: '1.25rem' }}>{residentCheckInDate}</div>
                  <div className="metric-note">Check-out {residentCheckOutDate}</div>
                </div>
              </div>
            </div>

            <div className="spotlight-card flex flex-col justify-between">
              <div>
                <div className="metric-label">Booking next step</div>
                <div className="mt-3 text-2xl font-extrabold text-[var(--text-primary)]">Choose a room, confirm your dates, and send the booking request.</div>
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  You can adjust your dates here at any time and the room list will refresh automatically.
                </p>
              </div>
              <Link to="/checkin/request" className="btn btn-primary mt-6 w-full sm:w-auto">
                Open check-in request
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="form-label">Check-in date</label>
              <input
                type="date"
                className="form-input"
                min={formatDate(today)}
                value={residentCheckInDate}
                onChange={(event) => setResidentCheckInDate(event.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Check-out date</label>
              <input
                type="date"
                className="form-input"
                min={residentCheckInDate || formatDate(today)}
                value={residentCheckOutDate}
                onChange={(event) => setResidentCheckOutDate(event.target.value)}
              />
            </div>
          </div>
        </div>

        {residentRoomError && (
          <div className="alert-banner alert-error">
            {residentRoomError}
          </div>
        )}

        {residentRoomsLoading ? (
          <LoadingSpinner text="Checking room availability..." />
        ) : residentAvailableRooms.length === 0 ? (
          <EmptyState message="No rooms are available for the selected stay window." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {residentAvailableRooms.map((room) => (
              <div key={room.id} className="glass-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="metric-label">Room {room.roomNumber}</p>
                    <h3 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{room.type || room.roomType}</h3>
                  </div>
                  <div className="gradient-secondary flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg">
                    <BedDouble size={20} />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
                  <div className="card-subtle">
                    <div className="metric-label">Floor</div>
                    <div className="mt-2 text-lg font-bold text-[var(--text-primary)]">{room.floor}</div>
                  </div>
                  <div className="card-subtle">
                    <div className="metric-label">Area</div>
                    <div className="mt-2 text-lg font-bold text-[var(--text-primary)]">{room.area} m²</div>
                  </div>
                  <div className="card-subtle">
                    <div className="metric-label">Nightly rate</div>
                    <div className="mt-2 text-lg font-bold text-[var(--text-primary)]">{formatCurrency(room.dailyRate || room.monthlyRent || 0)}</div>
                  </div>
                  <div className="card-subtle">
                    <div className="metric-label">Capacity</div>
                    <div className="mt-2 text-lg font-bold text-[var(--text-primary)]">{room.maxCapacity || 1} guests</div>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <span className="badge badge-success">Ready to book</span>
                  <Link to="/checkin/request" className="btn btn-primary btn-sm">
                    Request check-in
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter((r) => r.status === 'Available').length;
  const occupiedRooms = rooms.filter((r) => r.status === 'Occupied').length;
  const pendingSR = serviceRequests.filter((r) => r.status === 'Pending').length;
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const occupancyData = [
    { name: 'Occupied', value: occupiedRooms },
    { name: 'Available', value: availableRooms },
  ];

  const serviceByType: Record<string, number> = {};
  serviceRequests.forEach((sr) => {
    serviceByType[sr.serviceType] = (serviceByType[sr.serviceType] || 0) + 1;
  });
  const serviceTypeData = Object.entries(serviceByType).map(([name, value]) => ({ name, value }));
  const topServiceTypes = [...serviceTypeData].sort((a, b) => b.value - a.value).slice(0, 4);

  const serviceByStatus: Record<string, number> = {};
  serviceRequests.forEach((sr) => {
    serviceByStatus[sr.status] = (serviceByStatus[sr.status] || 0) + 1;
  });
  const serviceStatusData = Object.entries(serviceByStatus).map(([name, value]) => ({ name, value }));

  const dailyRevenue = rooms
    .filter((r) => r.status === 'Occupied')
    .reduce((sum, r) => sum + (r.dailyRate || r.monthlyRent || 0), 0);

  const revenueData = [
    { name: 'Current Day', revenue: dailyRevenue },
    { name: 'Projected Daily', revenue: totalRooms > 0 ? (dailyRevenue / Math.max(occupiedRooms, 1)) * totalRooms : 0 },
  ];

  return (
    <div className="page-shell max-w-7xl space-y-6">
      <div className="hero-banner">
        <div className="hero-grid">
          <div>
            <span className="hero-kicker">
              <Sparkles size={14} />
              Hospitality operations dashboard
            </span>
            <div className="page-header mt-5">
              <h1 className="page-title">Coordinate stays, rooms, and revenue from one screen</h1>
              <p className="page-subtitle">
                Charts, live operating metrics, and service alerts are grouped into a cleaner booking-style command center.
              </p>
            </div>
            <div className="listing-summary mt-6">
              <div className="metric-card">
                <div className="metric-label">Occupancy rate</div>
                <div className="metric-value">{occupancyRate}%</div>
                <div className="metric-note">{occupiedRooms}/{totalRooms} rooms currently occupied</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Current revenue</div>
                <div className="metric-value">{formatCurrency(dailyRevenue)}</div>
                <div className="metric-note">Based on occupied rooms</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Pending check-ins</div>
                <div className="metric-value">{pendingCheckIns}</div>
                <div className="metric-note">Needs approval before arrival</div>
              </div>
              <div className="metric-card">
                <div className="metric-label">Pending service tasks</div>
                <div className="metric-value">{pendingSR}</div>
                <div className="metric-note">Still waiting for action</div>
              </div>
            </div>
          </div>

          <div className="spotlight-card flex flex-col justify-between">
            <div>
              <div className="metric-label">Shift focus</div>
              <div className="mt-3 text-2xl font-extrabold text-[var(--text-primary)]">Prioritize occupied rooms and requests that still need attention today.</div>
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                Operations teams can jump straight into room inventory, pending arrivals, and service requests from this dashboard.
              </p>
            </div>
            <div className="quick-grid mt-6">
              <Link to="/rooms" className="card-subtle no-underline">
                <div className="metric-label">Rooms</div>
                <div className="mt-2 font-bold text-[var(--text-primary)]">Manage rooms</div>
              </Link>
              <Link to="/checkin/pending" className="card-subtle no-underline">
                <div className="metric-label">Check-in</div>
                <div className="mt-2 font-bold text-[var(--text-primary)]">Review queue</div>
              </Link>
              <Link to="/reports/revenue" className="card-subtle no-underline">
                <div className="metric-label">Revenue</div>
                <div className="mt-2 font-bold text-[var(--text-primary)]">View revenue</div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatsCard title="Total residents" value={residents.length} icon={<Users size={22} />} gradient="gradient-primary" />
        <StatsCard title="Total rooms" value={totalRooms} icon={<DoorOpen size={22} />} gradient="gradient-secondary" />
        <StatsCard title="Available rooms" value={availableRooms} icon={<DoorClosed size={22} />} gradient="gradient-success" />
        <StatsCard title="Pending check-ins" value={pendingCheckIns} icon={<Clock size={22} />} gradient="gradient-warning" />
        <StatsCard title="Service requests" value={serviceRequests.length} icon={<ConciergeBell size={22} />} gradient="gradient-info" subtitle={`${pendingSR} pending`} />
        <StatsCard title="Room-based revenue" value={formatCurrency(dailyRevenue)} icon={<CircleDollarSign size={22} />} gradient="gradient-danger" />
      </div>

      <div className="insight-grid">
        <div className="spotlight-card">
          <div className="metric-label">Most requested services</div>
          <div className="mt-4 space-y-3">
            {topServiceTypes.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">No service request data is available for analysis yet.</p>
            ) : (
              topServiceTypes.map((item) => (
                <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border-color)] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="gradient-info flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-lg">
                      <FileText size={18} />
                    </div>
                    <div>
                      <div className="font-semibold text-[var(--text-primary)]">{item.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">Current request volume</div>
                    </div>
                  </div>
                  <strong className="text-[var(--text-primary)]">{item.value}</strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="spotlight-card">
          <div className="metric-label">What needs attention</div>
          <div className="mt-4 space-y-3 text-sm text-[var(--text-secondary)]">
            <div className="card-subtle">
              <div className="flex items-center gap-3">
                <CalendarClock size={18} className="text-[var(--color-primary)]" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{pendingCheckIns} check-in requests are still waiting</div>
                  <div className="text-xs text-[var(--text-muted)]">Approve them quickly to avoid arrival delays</div>
                </div>
              </div>
            </div>
            <div className="card-subtle">
              <div className="flex items-center gap-3">
                <BedDouble size={18} className="text-[var(--color-accent)]" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">{availableRooms} rooms are ready to sell</div>
                  <div className="text-xs text-[var(--text-muted)]">Useful if you want to push occupancy higher</div>
                </div>
              </div>
            </div>
            <div className="card-subtle">
              <div className="flex items-center gap-3">
                <ArrowRight size={18} className="text-[var(--color-info)]" />
                <div>
                  <div className="font-semibold text-[var(--text-primary)]">Projected revenue {formatCurrency(revenueData[1].revenue)}</div>
                  <div className="text-xs text-[var(--text-muted)]">Estimated if all rooms were occupied</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Room occupancy</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={occupancyData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                dataKey="value" paddingAngle={5} label={({ name, value }) => `${name}: ${value}`}>
                {occupancyData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Requests by type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={serviceTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Request progress</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={serviceStatusData} cx="50%" cy="50%" outerRadius={90}
                dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {serviceStatusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-4 text-base font-semibold text-[var(--text-primary)]">Revenue overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                formatter={(value) => {
                  const revenue = typeof value === 'number' ? value : Number(value ?? 0);
                  return [formatCurrency(revenue), 'Revenue'];
                }}
              />
              <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

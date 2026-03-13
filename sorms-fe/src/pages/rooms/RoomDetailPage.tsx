import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { roomApi } from '../../api/rooms';
import { buildImageUrl } from '../../api/client';
import type { RoomDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { ArrowLeft, Pencil } from 'lucide-react';

export default function RoomDetailPage() {
  const { id } = useParams();
  const [room, setRoom] = useState<RoomDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    roomApi.getById(Number(id)).then((r) => setRoom(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!room) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Room not found.</div>;

  const info = [
    ['Room Number', room.roomNumber], ['Type', room.type || room.roomType],
    ['Floor', `${room.floor}`], ['Area', `${room.area} m²`],
    ['Daily Rate', `$${(room.dailyRate || room.monthlyRent || 0).toLocaleString()}`],
    ['Maintenance End', room.maintenanceEndDate ? new Date(room.maintenanceEndDate).toLocaleDateString() : '—'],
    ['Current Resident', room.currentResident || '—'],
    ['Description', room.description || '—'],
  ];

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link to="/rooms" className="btn btn-ghost btn-sm"><ArrowLeft size={18} /></Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, flex: 1 }}>Room {room.roomNumber}</h1>
        <Link to={`/rooms/${id}/edit`} className="btn btn-primary btn-sm"><Pencil size={16} /> Edit</Link>
      </div>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {room.imageUrl ? (
            <img 
              src={buildImageUrl(room.imageUrl)}
              alt={`Room ${room.roomNumber}`}
              style={{ width: 200, height: 150, objectFit: 'cover', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
          ) : (
            <div className="gradient-secondary" style={{ width: 150, height: 150, borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
              {room.roomNumber}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Room {room.roomNumber}</h2>
            <StatusBadge status={room.status} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {info.map(([label, value]) => (
            <div key={label}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</p>
              <p style={{ fontSize: '0.875rem' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

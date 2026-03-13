import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { roomApi } from '../../api/rooms';
import { buildImageUrl } from '../../api/client';
import { uploadApi } from '../../api/uploadApi';
import type { RoomDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ArrowLeft, Save, Upload, Image as ImageIcon } from 'lucide-react';

export default function RoomFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState<Partial<RoomDto>>({
    roomNumber: '', type: '', floor: 1, dailyRate: 0, area: 0, maxCapacity: 1, description: '', isActive: true, imageUrl: '', status: 'Available'
  });

  useEffect(() => {
    if (isEdit) {
        roomApi.getById(Number(id)).then((r) => {
            setForm(r.data);
        }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const res = await uploadApi.uploadImage(file);
      setForm((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSaving(true);
    try {
      if (isEdit) await roomApi.update(Number(id), form);
      else await roomApi.create(form);
      navigate('/rooms');
    } catch (err: any) {
      setError(err.response?.data || 'Failed to save.');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <Link to="/rooms" className="btn btn-ghost btn-sm"><ArrowLeft size={18} /></Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{isEdit ? 'Edit' : 'Create'} Room</h1>
      </div>
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.8125rem', color: '#f87171' }}>{typeof error === 'string' ? error : 'Error occurred'}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* Image Upload Section */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Room Image</label>
            <div 
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '0.5rem',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-input)',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {form.imageUrl ? (
                <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                  <img 
                    src={buildImageUrl(form.imageUrl)}
                    alt="Room Preview" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '0.25rem' }}
                  />
                  <div style={{ 
                    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0, transition: 'opacity 0.2s' 
                  }} onMouseEnter={(e) => e.currentTarget.style.opacity = '1'} onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}>
                    <span style={{ color: 'white', fontWeight: 500, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <Upload size={20} /> Change Image
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                  <ImageIcon size={40} opacity={0.5} />
                  <span>{uploading ? 'Uploading...' : 'Click to select an image'}</span>
                  <span style={{ fontSize: '0.75rem' }}>JPG, PNG, GIF up to 5MB</span>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label className="form-label">Room Number *</label><input className="form-input" value={form.roomNumber || ''} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} required /></div>
            <div><label className="form-label">Type *</label><select className="form-input" value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
              <option value="">Select...</option><option value="Single">Single</option><option value="Double">Double</option><option value="Suite">Suite</option><option value="Shared">Shared</option>
            </select></div>
            <div><label className="form-label">Floor</label><input type="number" className="form-input" value={form.floor || 1} onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })} /></div>
            <div><label className="form-label">Area (m²)</label><input type="number" step="0.1" className="form-input" value={form.area || 0} onChange={(e) => setForm({ ...form, area: Number(e.target.value) })} /></div>
            <div><label className="form-label">Max Capacity</label><input type="number" min={1} className="form-input" value={form.maxCapacity || 1} onChange={(e) => setForm({ ...form, maxCapacity: Math.max(1, Number(e.target.value) || 1) })} /></div>
            <div><label className="form-label">Daily Rate ($)</label><input type="number" step="0.01" className="form-input" value={form.dailyRate || form.monthlyRent || 0} onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })} /></div>
            <div>
              <label className="form-label">Status *</label>
              <select className="form-input" value={form.status || 'Available'} onChange={(e) => setForm({ ...form, status: e.target.value })} required>
                <option value="Available">Available</option>
                <option value="Occupied">Occupied</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
            {form.status === 'Maintenance' && (
              <div>
                <label className="form-label">Maintenance End Date</label>
                <input type="date" className="form-input" value={form.maintenanceEndDate ? new Date(form.maintenanceEndDate).toISOString().split('T')[0] : ''} onChange={(e) => setForm({ ...form, maintenanceEndDate: e.target.value })} />
              </div>
            )}
            <div style={{ gridColumn: 'span 2' }}><label className="form-label">Description</label><textarea className="form-input" rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}><Save size={18} /> {saving ? 'Saving...' : 'Save'}</button>
            <Link to="/rooms" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

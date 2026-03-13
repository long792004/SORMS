import { useEffect, useState } from 'react';
import { residentApi } from '../../api/residents';
import type { ResidentDto } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';
import { Save, User } from 'lucide-react';

export default function MyProfilePage() {
  const [profile, setProfile] = useState<ResidentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({ address: '', emergencyContact: '', notes: '' });
  const [accountForm, setAccountForm] = useState({ email: '', phone: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await residentApi.getMyProfile();
      setProfile(res.data);
      setProfileForm({ address: res.data.address || '', emergencyContact: res.data.emergencyContact || '', notes: res.data.notes || '' });
      setAccountForm({ email: res.data.email || '', phone: res.data.phone || res.data.phoneNumber || '' });
    } catch { /* noop */ } finally { setLoading(false); }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await residentApi.updateProfile(profileForm);
      setSuccess('Profile updated successfully!');
    } catch (err: any) {
      setError(err.response?.data || 'Failed to update.');
    } finally { setSaving(false); }
  };

  const handleUpdateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      await residentApi.updateAccount(accountForm);
      setSuccess('Account updated successfully!');
    } catch (err: any) {
      setError(err.response?.data || 'Failed to update.');
    } finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner />;
  if (!profile) return <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Profile not found. Please contact admin.</div>;

  return (
    <div className="page-shell mx-auto content-stack p-4 sm:p-6">
      <div className="hero-banner">
        <div className="hero-grid">
          <div>
            <span className="hero-kicker">Resident account</span>
            <div className="page-header mt-5">
              <h1 className="page-title">Manage your resident profile</h1>
              <p className="page-subtitle">
                Update your contact details and supporting notes without leaving the resident workspace.
              </p>
            </div>
          </div>
          <div className="spotlight-card flex flex-col justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="identity-badge gradient-primary"><User size={24} /></div>
              <div>
                <div className="text-lg font-semibold text-[var(--text-primary)]">{profile.fullName}</div>
                <div className="mt-1 text-sm text-[var(--text-muted)]">Room {profile.roomNumber || 'Not assigned yet'}</div>
              </div>
            </div>
            <div className="page-actions">
              <span className="stat-pill">Resident access</span>
              <span className="stat-pill">Self-service updates</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="alert-banner alert-error">{error}</div>}
      {success && <div className="alert-banner alert-success">{success}</div>}

      <div className="glass-card panel">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Account settings</h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">These details control how the system contacts you and recognizes your account.</p>
        <form onSubmit={handleUpdateAccount}>
          <div className="form-grid-2 mt-5">
            <div><label className="form-label">Email</label><input type="email" className="form-input" value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} /></div>
            <div><label className="form-label">Phone</label><input className="form-input" value={accountForm.phone} onChange={(e) => setAccountForm({ ...accountForm, phone: e.target.value })} /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm mt-5" disabled={saving}><Save size={16} /> Save account</button>
        </form>
      </div>

      <div className="glass-card panel">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">Profile information</h3>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Keep your address, emergency contact, and notes current for smoother support and check-in coordination.</p>
        <form onSubmit={handleUpdateProfile}>
          <div className="content-stack mt-5">
            <div><label className="form-label">Address</label><input className="form-input" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} /></div>
            <div><label className="form-label">Emergency Contact</label><input className="form-input" value={profileForm.emergencyContact} onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })} /></div>
            <div><label className="form-label">Notes</label><textarea className="form-input" rows={3} value={profileForm.notes} onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })} /></div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm mt-5" disabled={saving}><Save size={16} /> Save profile</button>
        </form>
      </div>
    </div>
  );
}

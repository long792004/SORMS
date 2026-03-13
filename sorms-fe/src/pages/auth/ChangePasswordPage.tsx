import { useState } from 'react';
import { authApi } from '../../api/auth';
import { KeyRound } from 'lucide-react';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess('Password changed successfully!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell max-w-2xl space-y-5">
      <div className="page-header">
        <h1 className="page-title">Change Password</h1>
        <p className="page-subtitle">Keep your account secure by updating your password regularly.</p>
      </div>

      <div className="glass-card p-6">
        {error && (
          <div className="alert-banner alert-error mb-4">{error}</div>
        )}
        {success && (
          <div className="alert-banner alert-success mb-4">{success}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label">Current Password</label>
            <input type="password" className="form-input"
              value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          </div>
          <div className="mb-4">
            <label className="form-label">New Password</label>
            <input type="password" className="form-input" placeholder="Min 6 characters"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </div>
          <div className="mb-6">
            <label className="form-label">Confirm New Password</label>
            <input type="password" className="form-input"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <KeyRound size={18} />
            {loading ? 'Saving...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

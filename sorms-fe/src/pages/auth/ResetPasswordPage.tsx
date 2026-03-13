import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { KeyRound } from 'lucide-react';

export default function ResetPasswordPage() {
  const location = useLocation();
  const { email: emailFromState = '', otp: otpFromState = '' } = (location.state as any) || {};
  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState(otpFromState);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword({ email, otp, newPassword });
      setSuccess('Password reset successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-6 text-center text-xl font-semibold text-[var(--text-primary)]">
        Reset Password
      </h2>
      {error && (
        <div className="alert-banner alert-error mb-4">{error}</div>
      )}
      {success && (
        <div className="alert-banner alert-success mb-4">{success}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="form-label">OTP Code</label>
          <input type="text" className="form-input" value={otp}
            onChange={(e) => setOtp(e.target.value)} required />
        </div>
        <div className="mb-4">
          <label className="form-label">New Password</label>
          <input type="password" className="form-input" placeholder="Min 6 characters"
            value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
        </div>
        <div className="mb-6">
          <label className="form-label">Confirm Password</label>
          <input type="password" className="form-input"
            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
          <KeyRound size={18} />
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <div className="mt-6 text-center text-sm">
        <Link to="/login" className="text-[var(--color-primary-light)] no-underline hover:underline">
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}

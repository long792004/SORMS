import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { ShieldCheck } from 'lucide-react';

export default function VerifyOtpPage() {
  const location = useLocation();
  const emailFromState = (location.state as any)?.email || '';
  const [email, setEmail] = useState(emailFromState);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.verifyOtp({ email, otp });
      navigate('/reset-password', { state: { email, otp } });
    } catch (err: any) {
      setError(err.response?.data || 'Invalid or expired OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-center text-xl font-semibold text-[var(--text-primary)]">
        Verify OTP
      </h2>
      <p className="mb-6 text-center text-sm text-[var(--text-muted)]">
        Enter the OTP code sent to your email
      </p>
      {error && (
        <div className="alert-banner alert-error mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-6">
          <label className="form-label">OTP Code</label>
          <input type="text" className="form-input" placeholder="Enter 6-digit OTP"
            value={otp} onChange={(e) => setOtp(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
          <ShieldCheck size={18} />
          {loading ? 'Verifying...' : 'Verify OTP'}
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

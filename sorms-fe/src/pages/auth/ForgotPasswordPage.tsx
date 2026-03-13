import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      navigate('/verify-otp', { state: { email } });
    } catch (err: any) {
      setError(err.response?.data || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-2 text-center text-xl font-semibold text-[var(--text-primary)]">
        Forgot Password
      </h2>
      <p className="mb-6 text-center text-sm text-[var(--text-muted)]">
        Enter your email to receive an OTP code
      </p>
      {error && (
        <div className="alert-banner alert-error mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="form-label">Email</label>
          <input type="email" className="form-input" placeholder="Enter your email"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
          <Mail size={18} />
          {loading ? 'Sending...' : 'Send OTP'}
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

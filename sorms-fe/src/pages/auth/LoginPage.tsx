import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { ArrowRight, LogIn, LockKeyhole, Mail } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { token, userId, userRole, username, email: userEmail } = res.data;
      login(token, { userId, userRole, username, email: userEmail });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-7 text-center">
        <span className="section-eyebrow">Resident and staff access</span>
        <h2 className="mt-4 text-3xl font-bold text-[var(--text-primary)]">
          Sign in to manage every stay with confidence
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Access rooms, check-in requests, invoices, and service tasks from one organized workspace.
        </p>
      </div>

      {error && (
        <div className="alert-banner alert-error mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Email</label>
          <div className="relative">
            <Mail size={16} className="search-icon" />
            <input
              type="email"
              className="form-input search-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div>
          <label className="form-label">Password</label>
          <div className="relative">
            <LockKeyhole size={16} className="search-icon" />
            <input
              type="password"
              className="form-input search-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
          <LogIn size={18} />
          {loading ? 'Signing in...' : 'Sign in now'}
        </button>
      </form>

      <div className="card-subtle mt-5">
        <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
          <span>Need to recover your account or create a new one?</span>
          <ArrowRight size={16} className="shrink-0 text-[var(--color-primary)]" />
        </div>
      </div>

      <div className="mt-5 text-center text-sm text-[var(--text-muted)]">
        <Link to="/forgot-password" className="text-[var(--color-primary)] no-underline hover:underline">
          Forgot password?
        </Link>
        <span className="mx-2">•</span>
        <Link to="/register" className="text-[var(--color-primary)] no-underline hover:underline">
          Create a new account
        </Link>
      </div>
    </div>
  );
}

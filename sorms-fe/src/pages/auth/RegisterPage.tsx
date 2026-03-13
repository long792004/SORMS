import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';
import { ArrowRight, ShieldCheck, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '', userName: '', password: '', confirmPassword: '',
    fullName: '', phone: '', identityNumber: '', address: '', emergencyContact: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        email: form.email, userName: form.userName, password: form.password,
        roleId: 3, // Resident
        fullName: form.fullName || undefined, phone: form.phone || undefined,
        identityNumber: form.identityNumber || undefined, address: form.address || undefined,
        emergencyContact: form.emergencyContact || undefined,
      });
      const { token, userId, userRole, username, email } = res.data;
      login(token, { userId, userRole, username, email });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.Message || err.response?.data || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'fullName', label: 'Full name', type: 'text' },
    { name: 'userName', label: 'Username *', type: 'text', required: true },
    { name: 'email', label: 'Email *', type: 'email', required: true },
    { name: 'phone', label: 'Phone number', type: 'text' },
    { name: 'password', label: 'Password *', type: 'password', required: true },
    { name: 'confirmPassword', label: 'Confirm password *', type: 'password', required: true },
    { name: 'identityNumber', label: 'Identity number', type: 'text' },
    { name: 'emergencyContact', label: 'Emergency contact', type: 'text' },
    { name: 'address', label: 'Address', type: 'text' },
  ];

  return (
    <div>
      <div className="mb-7 text-center">
        <span className="section-eyebrow">Resident onboarding</span>
        <h2 className="mt-4 text-3xl font-bold text-[var(--text-primary)]">
          Create an account to book and manage your stay
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Fill in your details to set up your resident profile, track check-in activity, and manage invoices in one dashboard.
        </p>
      </div>

      {error && (
        <div className="alert-banner alert-error mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name} className={f.name === 'address' ? 'sm:col-span-2' : ''}>
              <label className="form-label">{f.label}</label>
              <input
                type={f.type} name={f.name} className="form-input"
                value={(form as any)[f.name]} onChange={handleChange} required={f.required}
              />
            </div>
          ))}
        </div>
        <button type="submit" className="btn btn-primary btn-lg mt-5 w-full" disabled={loading}>
          <UserPlus size={18} />
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <div className="card-subtle mt-5 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
        <ShieldCheck size={18} className="text-[var(--color-primary)]" />
        <span>Your account will be created with the Resident role and can manage check-in requests, service requests, and invoices.</span>
      </div>

      <div className="mt-5 text-center text-sm text-[var(--text-muted)]">
        Already have an account?{' '}
        <Link to="/login" className="text-[var(--color-primary)] no-underline hover:underline">Sign in</Link>
        <span className="mx-2">•</span>
        <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
          Quick access to sign-in
          <ArrowRight size={14} />
        </span>
      </div>
    </div>
  );
}

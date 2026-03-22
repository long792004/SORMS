import { Outlet } from 'react-router-dom';
import { BadgeCheck, Clock3, ShieldCheck, Sparkles } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="auth-bg relative flex min-h-screen items-center justify-center p-4 lg:p-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div style={{
          position: 'absolute', width: 460, height: 460, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217,119,6,0.16) 0%, transparent 68%)',
          top: '-120px', right: '-100px',
        }} />
        <div style={{
          position: 'absolute', width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(15,118,110,0.14) 0%, transparent 70%)',
          bottom: '-100px', left: '-100px',
        }} />
      </div>
      <div className="auth-shell animate-fade-in">
        <section className="auth-showcase">
          <div>
            <span className="auth-kicker">
              <Sparkles size={14} />
              Hospitality Booking System
            </span>
            <h1 className="auth-display">Run every stay like a premium booking platform.</h1>
            <p className="auth-copy">
              The redesigned workspace keeps room inventory, invoices, check-in flow, service requests, and notifications clear, fast, and easy to act on.
            </p>

            <div className="auth-metric-grid">
              <div className="auth-metric">
                <strong>24/7</strong>
                <span>Always-on operations</span>
              </div>
              <div className="auth-metric">
                <strong>One view</strong>
                <span>Rooms, stays, and billing together</span>
              </div>
              <div className="auth-metric">
                <strong>Live</strong>
                <span>Availability and status updates</span>
              </div>
            </div>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature">
              <BadgeCheck size={20} />
              <div>
                <strong>Clear booking flow</strong>
                <span>Availability, occupancy, stay history, and payments stay visible in one structured journey.</span>
              </div>
            </div>
            <div className="auth-feature">
              <Clock3 size={20} />
              <div>
                <strong>Faster check-in and check-out</strong>
                <span>Pending, confirmed, active, and completed states are easy to review without extra navigation.</span>
              </div>
            </div>
            <div className="auth-feature">
              <ShieldCheck size={20} />
              <div>
                <strong>Role-aware operations</strong>
                <span>Admin, staff, and resident experiences stay separated cleanly from the moment each user signs in.</span>
              </div>
            </div>
          </div>
        </section>

        <div className="auth-card">
          <div className="mb-8 text-center">
            <div className="gradient-primary mx-auto mb-4 flex h-15 w-15 items-center justify-center rounded-[1.35rem] text-2xl font-extrabold text-white shadow-lg">
              S
            </div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">SORMS StayFlow</h1>
            <p className="mx-auto mt-2 max-w-[340px] text-sm text-[var(--text-muted)]">
              A polished room and stay management system with a calmer layout, better hierarchy, and smoother daily workflows.
            </p>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

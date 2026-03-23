import { Building2, Compass, Menu, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";
import { useAuthStore } from "@/store/authStore";
import { useRoleRedirect } from "@/hooks/useRoleRedirect";

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const roleHome = useRoleRedirect(role);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/78 backdrop-blur-xl">
      <div className="page-shell flex items-center justify-between py-3">
        <div className="flex items-center gap-3">
          {onMenuClick ? (
            <button className="rounded-xl border border-slate-200/70 bg-white/80 p-2.5 hover:bg-slate-50 lg:hidden" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <Link to="/" className="group inline-flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-soft">
              <Building2 className="h-5 w-5" />
            </span>
            <span>
              <span className="font-heading text-xl font-semibold tracking-tight text-slate-900">SORM</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">Smart Residence OS</span>
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 rounded-2xl border border-slate-200/70 bg-white/78 p-1 text-sm text-slate-700 md:flex">
          <Link to="/" className="rounded-xl px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900">Home</Link>
          <Link to="/rooms" className="rounded-xl px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900">Rooms</Link>
          <Link to="/about" className="rounded-xl px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900">About</Link>
          <Link to="/contact" className="rounded-xl px-3 py-2 transition hover:bg-slate-100 hover:text-slate-900">Contact</Link>
        </nav>

        <div className="flex items-center gap-2">
          <button className="hidden rounded-xl border border-slate-200/70 bg-white/80 p-2.5 hover:bg-slate-50 sm:block" onClick={() => navigate("/search")}>
            <Search className="h-4 w-4 text-slate-700" />
          </button>
          {isAuthenticated ? <NotificationDropdown /> : null}
          {!isAuthenticated ? (
            <>
              <Link to="/rooms" className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 lg:inline-flex">
                <Compass className="h-4 w-4" /> Explore
              </Link>
              <Link to="/login" className="rounded-xl bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-soft hover:opacity-95">Login</Link>
            </>
          ) : (
            <>
              <button
                className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm font-medium hover:bg-slate-50"
                onClick={() => navigate(roleHome)}
              >
                Dashboard
              </button>
              <button
                className="rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                onClick={() => {
                  clearAuth();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

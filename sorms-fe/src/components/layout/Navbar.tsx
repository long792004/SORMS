import { Menu, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/80">
      <div className="page-shell flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          {onMenuClick ? (
            <button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10 lg:hidden" onClick={onMenuClick}>
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <Link to="/" className="font-heading text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            SORM
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-sm text-slate-700 dark:text-slate-200 md:flex">
          <Link to="/" className="hover:text-primary">Home</Link>
          <Link to="/rooms" className="hover:text-primary">Rooms</Link>
          <Link to="/about" className="hover:text-primary">About</Link>
          <Link to="/contact" className="hover:text-primary">Contact</Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => navigate("/search")}>
            <Search className="h-4 w-4" />
          </button>
          {isAuthenticated ? <NotificationDropdown /> : null}
          {!isAuthenticated ? (
            <Link to="/login" className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10">Login</Link>
          ) : (
            <>
              <button
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"
                onClick={() => navigate(roleHome)}
              >
                Dashboard
              </button>
              <button
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/10"
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

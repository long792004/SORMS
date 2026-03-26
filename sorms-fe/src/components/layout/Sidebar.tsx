import { Link, useLocation } from "react-router-dom";
import { UserRole } from "@/types/common";

interface NavItem {
  to: string;
  label: string;
}

const residentItems: NavItem[] = [
  { to: "/resident/dashboard", label: "Dashboard" },
  { to: "/resident/profile", label: "My Profile" },
  { to: "/resident/bookings", label: "My Bookings" },
  { to: "/resident/checkin-status", label: "Check-in / Out" },
  { to: "/resident/payments", label: "My Payments" },
  { to: "/resident/invoices", label: "My Invoices" },
  { to: "/resident/reviews", label: "My Reviews" },
  { to: "/resident/services", label: "Service Requests" },
  { to: "/resident/services/create", label: "Create Service" },
  { to: "/resident/notifications", label: "Notifications" }
];

const staffItems: NavItem[] = [
  { to: "/staff/dashboard", label: "Dashboard" },
  { to: "/staff/checkin-checkout", label: "Check-in / Out" },
  { to: "/staff/history-booking", label: "History Booking" },
  { to: "/staff/residents", label: "Residents" },
  { to: "/staff/rooms", label: "Rooms" },
  { to: "/staff/service-requests", label: "Service Requests" },
  { to: "/staff/reports", label: "Reports" },
  { to: "/staff/notifications", label: "Notifications" }
];

const adminItems: NavItem[] = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/checkin-checkout", label: "Check-in / Out" },
  { to: "/admin/history-booking", label: "History Booking" },
  { to: "/admin/residents", label: "Residents" },
  { to: "/admin/staff", label: "Staff" },
  { to: "/admin/rooms", label: "Rooms" },
  { to: "/admin/reviews", label: "Reviews" },
  { to: "/admin/payments", label: "Invoices" },
  { to: "/admin/service-requests", label: "Service Requests" },
  { to: "/admin/reports/revenue", label: "Reports" },
  { to: "/admin/vouchers", label: "Vouchers" },
  { to: "/admin/notifications", label: "Notifications" },
  { to: "/admin/settings", label: "Settings" }
];

const getItems = (role: UserRole | null): NavItem[] => {
  if (role === "Resident") return residentItems;
  if (role === "Staff") return staffItems;
  return adminItems;
};

interface SidebarProps {
  role: UserRole | null;
  className?: string;
  onNavigate?: () => void;
}

export function Sidebar({ role, className = "", onNavigate }: SidebarProps) {
  const location = useLocation();
  const items = getItems(role);

  return (
    <aside className={`glass-card h-[calc(100vh-6.2rem)] w-full max-w-[268px] rounded-2xl p-3 ${className}`}>
      <div className="mb-4 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Workspace</p>
        <p className="mt-1 font-heading text-lg font-semibold text-slate-900">{role ?? "Admin"} Portal</p>
      </div>
      <nav className="space-y-1.5 overflow-y-auto pr-1">
        {items.map((item) => {
          const isActive = location.pathname === item.to;

          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-gradient text-white shadow-soft"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

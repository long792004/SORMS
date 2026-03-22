import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/authStore";

export function DashboardLayout() {
  const role = useAuthStore((state) => state.role);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:bg-radial-lux dark:text-slate-100">
      <Navbar onMenuClick={() => setMobileOpen(true)} />
      <div className="page-shell flex gap-4">
        <Sidebar role={role} className="sticky top-20 hidden lg:block" />
        <div className="min-h-[70vh] flex-1 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
          <Outlet />
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-3 top-20" onClick={(event) => event.stopPropagation()}>
            <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

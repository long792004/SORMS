import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/store/authStore";

export function DashboardLayout() {
  const role = useAuthStore((state) => state.role);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen text-slate-900">
      <Navbar onMenuClick={() => setMobileOpen(true)} />
      <div className="page-shell">
        <div className="grid gap-5 lg:grid-cols-[268px_minmax(0,1fr)]">
          <Sidebar role={role} className="sticky top-24 hidden lg:block" />
          <div className="app-panel min-h-[72vh] overflow-hidden">
            <Outlet />
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute left-3 top-20 w-[86%] max-w-sm" onClick={(event) => event.stopPropagation()}>
            <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

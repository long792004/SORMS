import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col text-slate-900">
      <Navbar />
      <div className="relative flex-1 py-2">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[220px] bg-radial-lux opacity-90" />
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

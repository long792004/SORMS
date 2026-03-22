import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

type Role = "Admin" | "Staff" | "Resident";

export function AuthGuard() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return <Outlet />;
}

interface RoleGuardProps {
  roles: Role[];
}

export function RoleGuard({ roles }: RoleGuardProps) {
  const role = useAuthStore((state) => state.role);

  if (!role || !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

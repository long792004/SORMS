import { useMemo } from "react";
import { UserRole } from "@/types/common";

export function useRoleRedirect(role: UserRole | null) {
  return useMemo(() => {
    if (role === "Resident") return "/resident/dashboard";
    if (role === "Staff") return "/staff/dashboard";
    if (role === "Admin") return "/admin/dashboard";
    return "/";
  }, [role]);
}

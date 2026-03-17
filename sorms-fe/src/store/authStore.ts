import { create } from "zustand";
import { STORAGE_KEYS } from "@/utils/constants";
import { UserRole } from "@/types/common";

interface AuthState {
  token: string | null;
  role: UserRole | null;
  userId: number | null;
  isAuthenticated: boolean;
  setAuth: (payload: { token: string; role: UserRole | null; userId: number | null }) => void;
  clearAuth: () => void;
}

const token = localStorage.getItem(STORAGE_KEYS.token);
const role = (localStorage.getItem(STORAGE_KEYS.role) as UserRole | null) ?? null;
const userIdRaw = localStorage.getItem(STORAGE_KEYS.userId);

export const useAuthStore = create<AuthState>((set) => ({
  token,
  role,
  userId: userIdRaw ? Number(userIdRaw) : null,
  isAuthenticated: !!token,
  setAuth: ({ token: nextToken, role: nextRole, userId: nextUserId }) => {
    localStorage.setItem(STORAGE_KEYS.token, nextToken);
    if (nextRole) localStorage.setItem(STORAGE_KEYS.role, nextRole);
    if (nextUserId !== null) localStorage.setItem(STORAGE_KEYS.userId, String(nextUserId));

    set({
      token: nextToken,
      role: nextRole,
      userId: nextUserId,
      isAuthenticated: true
    });
  },
  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.token);
    localStorage.removeItem(STORAGE_KEYS.role);
    localStorage.removeItem(STORAGE_KEYS.userId);

    set({
      token: null,
      role: null,
      userId: null,
      isAuthenticated: false
    });
  }
}));

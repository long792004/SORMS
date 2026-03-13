import { create } from 'zustand';

interface User {
  userId: number;
  username: string;
  email: string;
  userRole: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isResident: () => boolean;
  hasRole: (...roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  return {
    token: storedToken,
    user: storedUser ? JSON.parse(storedUser) : null,
    isAuthenticated: !!storedToken,

    login: (token, user) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false });
    },

    isAdmin: () => get().user?.userRole === 'Admin',
    isStaff: () => get().user?.userRole === 'Staff',
    isResident: () => get().user?.userRole === 'Resident',
    hasRole: (...roles) => {
      const role = get().user?.userRole;
      return role ? roles.includes(role) : false;
    },
  };
});

export const STORAGE_KEYS = {
  token: "token",
  role: "role",
  userId: "userId"
} as const;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5183/api";

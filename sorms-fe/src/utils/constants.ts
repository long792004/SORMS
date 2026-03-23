export const STORAGE_KEYS = {
  token: "token",
  role: "role",
  userId: "userId"
} as const;

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7001/api";

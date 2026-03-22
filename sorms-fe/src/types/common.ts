export type UserRole = "Admin" | "Staff" | "Resident";

export interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data: T;
}

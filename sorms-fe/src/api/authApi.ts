import { api } from "@/api/axios";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  userName: string;
  password: string;
  roleId: number;
  fullName?: string;
  phone?: string;
  identityNumber?: string;
  gender?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export const authApi = {
  login: (payload: LoginPayload) => api.post("/Auth/login", payload),
  register: (payload: RegisterPayload) => api.post("/Auth/register", payload),
  forgotPassword: (payload: ForgotPasswordPayload) => api.post("/Auth/forgot-password", payload),
  verifyOtp: (payload: VerifyOtpPayload) => api.post("/Auth/verify-otp", payload),
  resetPassword: (payload: ResetPasswordPayload) => api.post("/Auth/reset-password", payload),
  changePassword: (payload: { currentPassword: string; newPassword: string }) => api.post("/Auth/change-password", payload),
  updateEmail: (payload: { email: string }) => api.put("/Auth/update-email", payload),
  seedAdmin: () => api.post("/Auth/seed-admin"),
  createStaff: (payload: RegisterPayload) => api.post("/Auth/create-staff", payload)
};

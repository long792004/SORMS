import client from './client';
import type {
  LoginRequest, AuthResponse, RegisterRequest,
  ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest,
  ChangePasswordRequest, UpdateEmailRequest, UserDto,
} from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<AuthResponse>('/Auth/login', data),

  register: (data: RegisterRequest) =>
    client.post<AuthResponse>('/Auth/register', data),

  getUser: (username: string) =>
    client.get<UserDto>(`/Auth/user/${username}`),

  forgotPassword: (data: ForgotPasswordRequest) =>
    client.post('/Auth/forgot-password', data),

  verifyOtp: (data: VerifyOtpRequest) =>
    client.post('/Auth/verify-otp', data),

  resetPassword: (data: ResetPasswordRequest) =>
    client.post('/Auth/reset-password', data),

  changePassword: (data: ChangePasswordRequest) =>
    client.post('/Auth/change-password', data),

  updateEmail: (data: UpdateEmailRequest) =>
    client.put('/Auth/update-email', data),

  seedAdmin: () =>
    client.post('/Auth/seed-admin'),

  createStaff: (data: RegisterRequest) =>
    client.post('/Auth/create-staff', data),
};

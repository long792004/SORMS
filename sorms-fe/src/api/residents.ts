import client from './client';
import type { ResidentDto, UpdateResidentProfileRequest, UpdateResidentAccountRequest, VerifyIdentityRequest } from '../types';

export const residentApi = {
  getAll: () =>
    client.get<ResidentDto[]>('/Resident'),

  getById: (id: number) =>
    client.get<ResidentDto>(`/Resident/${id}`),

  create: (data: Partial<ResidentDto>) =>
    client.post<ResidentDto>('/Resident', data),

  update: (id: number, data: Partial<ResidentDto>) =>
    client.put(`/Resident/${id}`, data),

  delete: (id: number) =>
    client.delete(`/Resident/${id}`),

  getByRoom: (roomId: number) =>
    client.get<ResidentDto[]>(`/Resident/room/${roomId}`),

  getMyProfile: () =>
    client.get<ResidentDto>('/Resident/my-profile'),

  updateProfile: (data: UpdateResidentProfileRequest) =>
    client.put('/Resident/update-profile', data),

  updateAccount: (data: UpdateResidentAccountRequest) =>
    client.put('/Resident/update-account', data),

  verifyIdentity: (data: VerifyIdentityRequest) =>
    client.post('/Resident/verify-identity', data),
};

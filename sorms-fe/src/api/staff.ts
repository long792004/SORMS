import client from './client';
import type { StaffDto } from '../types';

export const staffApi = {
  getAll: () =>
    client.get<StaffDto[]>('/Staff'),

  getById: (id: number) =>
    client.get<StaffDto>(`/Staff/${id}`),

  update: (id: number, data: Partial<StaffDto>) =>
    client.put(`/Staff/${id}`, data),

  delete: (id: number) =>
    client.delete(`/Staff/${id}`),

  getMyProfile: () =>
    client.get<StaffDto>('/Staff/me'),

  updateMyProfile: (data: Partial<StaffDto>) =>
    client.put('/Staff/me', data),
};

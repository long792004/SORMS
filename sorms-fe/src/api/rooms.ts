import client from './client';
import type { RoomDto } from '../types';

export const roomApi = {
  getAll: () =>
    client.get<RoomDto[]>('/Room'),

  getById: (id: number) =>
    client.get<RoomDto>(`/Room/${id}`),

  create: (data: Partial<RoomDto>) =>
    client.post<RoomDto>('/Room', data),

  update: (id: number, data: Partial<RoomDto>) =>
    client.put(`/Room/${id}`, data),

  delete: (id: number) =>
    client.delete(`/Room/${id}`),

  getAvailable: (params?: { checkIn?: string; checkOut?: string }) =>
    client.get<RoomDto[]>('/Room/available', { params }),
};

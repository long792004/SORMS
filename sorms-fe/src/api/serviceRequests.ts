import client from './client';
import type {
  ServiceRequestDto, CreateServiceRequest, UpdateServiceRequest, ReviewServiceRequest,
} from '../types';

export const serviceRequestApi = {
  create: (data: CreateServiceRequest) =>
    client.post<ServiceRequestDto>('/ServiceRequest', data),

  getAll: () =>
    client.get<ServiceRequestDto[]>('/ServiceRequest'),

  getMyRequests: () =>
    client.get<ServiceRequestDto[]>('/ServiceRequest/my-requests'),

  getById: (id: number) =>
    client.get<ServiceRequestDto>(`/ServiceRequest/${id}`),

  update: (id: number, data: UpdateServiceRequest) =>
    client.put(`/ServiceRequest/${id}`, data),

  delete: (id: number) =>
    client.delete(`/ServiceRequest/${id}`),

  getPending: () =>
    client.get<ServiceRequestDto[]>('/ServiceRequest/pending'),

  review: (id: number, data: ReviewServiceRequest) =>
    client.post(`/ServiceRequest/${id}/review`, data),
};

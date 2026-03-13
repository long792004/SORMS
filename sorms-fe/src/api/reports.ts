import client from './client';
import type {
  ReportDto, CreateReportRequest, UpdateReportRequest, ReviewReportRequest,
} from '../types';

export const reportApi = {
  create: (data: CreateReportRequest) =>
    client.post<ReportDto>('/Report', data),

  getAll: () =>
    client.get<ReportDto[]>('/Report'),

  getById: (id: number) =>
    client.get<ReportDto>(`/Report/${id}`),

  update: (id: number, data: UpdateReportRequest) =>
    client.put(`/Report/${id}`, data),

  delete: (id: number) =>
    client.delete(`/Report/${id}`),

  review: (id: number, data: ReviewReportRequest) =>
    client.post(`/Report/${id}/review`, data),

  getPending: () =>
    client.get<ReportDto[]>('/Report/pending'),

  generateOccupancy: () =>
    client.post('/Report/occupancy'),

  generateServiceUsage: () =>
    client.post('/Report/service-usage'),

  generateRevenue: () =>
    client.post('/Report/revenue'),
};

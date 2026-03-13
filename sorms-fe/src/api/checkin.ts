import client from './client';
import type {
  CheckInRecordDto, CreateCheckInRequest, CreateCheckOutRequest, CancelCheckInRequest, ApproveCheckInRequest,
} from '../types';

export const checkInApi = {
  requestCheckIn: (data: CreateCheckInRequest) =>
    client.post('/CheckIn/request-checkin', data),

  requestCheckOut: (data: CreateCheckOutRequest) =>
    client.post('/CheckIn/request-checkout', data),

  cancelCheckIn: (data: CancelCheckInRequest) =>
    client.post('/CheckIn/cancel-checkin', data),

  approveCheckIn: (data: ApproveCheckInRequest) =>
    client.post('/CheckIn/approve-checkin', data),

  approveCheckOut: (data: ApproveCheckInRequest) =>
    client.post('/CheckIn/approve-checkout', data),

  getPendingCheckIn: () =>
    client.get<{ success: boolean; data: CheckInRecordDto[] }>('/CheckIn/pending-checkin'),

  getPendingCheckOut: () =>
    client.get<{ success: boolean; data: CheckInRecordDto[] }>('/CheckIn/pending-checkout'),

  getMyStatus: () =>
    client.get<{ success: boolean; data: CheckInRecordDto | null }>('/CheckIn/my-status'),

  getMyHistory: () =>
    client.get<{ success: boolean; data: CheckInRecordDto[] }>('/CheckIn/my-history'),

  getAll: () =>
    client.get<{ success: boolean; data: CheckInRecordDto[] }>('/CheckIn/all'),
};

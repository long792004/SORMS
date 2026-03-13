import client from './client';
import type { NotificationDto, CreateBroadcastNotification, CreateIndividualNotification } from '../types';

export const notificationApi = {
  broadcast: (data: CreateBroadcastNotification) =>
    client.post('/Notification/broadcast', data),

  sendIndividual: (data: CreateIndividualNotification) =>
    client.post('/Notification/individual', data),

  getMyNotifications: () =>
    client.get<NotificationDto[]>('/Notification/my-notifications'),

  getStaffNotifications: () =>
    client.get<NotificationDto[]>('/Notification/staff/my-notifications'),

  getByResident: (residentId: number) =>
    client.get<NotificationDto[]>(`/Notification/resident/${residentId}`),

  markAsRead: (notificationId: number) =>
    client.put(`/Notification/${notificationId}/read`),

  getSentHistory: () =>
    client.get<NotificationDto[]>('/Notification/sent-history'),
};

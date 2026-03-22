import client from './client';
import type {
  ApiResponse,
  CancelReservationRequest,
  ConfirmReservationPaymentRequest,
  CreateReservationRequest,
  ReservationDto,
} from '../types';

export const reservationApi = {
  create: (data: CreateReservationRequest) =>
    client.post<ApiResponse<ReservationDto>>('/Reservation', data),

  getMyReservations: () =>
    client.get<ApiResponse<ReservationDto[]>>('/Reservation/my'),

  getAll: () =>
    client.get<ApiResponse<ReservationDto[]>>('/Reservation'),

  getById: (id: number) =>
    client.get<ApiResponse<ReservationDto>>(`/Reservation/${id}`),

  cancel: (id: number, data: CancelReservationRequest) =>
    client.post<ApiResponse<null>>(`/Reservation/${id}/cancel`, data),

  confirmPayment: (id: number, data: ConfirmReservationPaymentRequest) =>
    client.post<ApiResponse<null>>(`/Reservation/${id}/confirm-payment`, data),
};

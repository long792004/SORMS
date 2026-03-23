import { api } from "@/api/axios";

export interface GuestInfo {
  fullName: string;
  identityNumber: string;
  phone: string;
}

export interface CreateReservationPayload {
  roomId: number;
  checkInDate: string; // ISO date string
  checkOutDate: string;
  numberOfGuests: number;
  guests: GuestInfo[];
  checkInTime?: string;  // "HH:mm"
  checkOutTime?: string; // "HH:mm"
}

export const reservationApi = {
  /** Tạo reservation mới (Hold 15 phút) */
  create: (payload: CreateReservationPayload) => api.post("/Reservation", payload),

  /** Lấy danh sách reservation của Resident đang đăng nhập */
  getMy: () => api.get("/Reservation/my"),

  /** Lấy chi tiết 1 reservation */
  getById: (id: number | string) => api.get(`/Reservation/${id}`),

  /** Hủy reservation */
  cancel: (id: number | string, reason?: string) =>
    api.post(`/Reservation/${id}/cancel`, { reason }),

  /** Xác nhận thanh toán sau khi redirect từ PayOS */
  confirmPayment: (id: number | string, orderCode: number) =>
    api.post(`/Reservation/${id}/confirm-payment`, { orderCode }),
};

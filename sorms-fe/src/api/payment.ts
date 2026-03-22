import client from './client';
import type { InvoiceDto, ApiResponse, CreateInvoiceRequest, RoomPricingDto, UpdateRoomPricingRequest, PaymentStatusDto, CreatePaymentLinkResponse, VerifyPaymentResponse } from '../types';

export const paymentApi = {
  // ===== Resident Invoice Endpoints =====
  getMyInvoices: async () => {
    const response = await client.get<ApiResponse<InvoiceDto[]>>('/Payment/my-invoices');
    return response.data;
  },

  getInvoiceById: async (invoiceId: number) => {
    const response = await client.get<ApiResponse<InvoiceDto>>(`/Payment/invoice/${invoiceId}`);
    return response.data;
  },

  getPaymentStatus: async (invoiceId: number) => {
    const response = await client.get<ApiResponse<PaymentStatusDto>>(`/Payment/payment-status/${invoiceId}`);
    return response.data;
  },

  createPaymentLink: async (invoiceId: number, returnUrl?: string, cancelUrl?: string) => {
    const response = await client.post<CreatePaymentLinkResponse>(
      `/Payment/create-payment-link/${invoiceId}`,
      { returnUrl, cancelUrl }
    );
    return response.data;
  },

  verifyPayment: async (orderCode: number) => {
    const response = await client.post<VerifyPaymentResponse>(`/Payment/verify-payment?orderCode=${orderCode}`);
    return response.data;
  },

  // ===== Admin/Staff Invoice Management =====
  getAllInvoices: async (pageNumber: number = 1, pageSize: number = 10) => {
    const response = await client.get<ApiResponse<InvoiceDto[]>>(`/Payment/all?pageNumber=${pageNumber}&pageSize=${pageSize}`);
    return response.data;
  },

  createInvoice: async (data: CreateInvoiceRequest) => {
    const response = await client.post<ApiResponse<InvoiceDto>>('/Payment/create', data);
    return response.data;
  },

  deleteInvoice: async (invoiceId: number) => {
    const response = await client.delete<ApiResponse<any>>(`/Payment/delete/${invoiceId}`);
    return response.data;
  },

  // ===== Room Pricing Management =====
  getRoomPricing: async (roomId: number) => {
    const response = await client.get<ApiResponse<RoomPricingDto>>(`/Payment/room-pricing/${roomId}`);
    return response.data;
  },

  getAllRoomPricings: async () => {
    const response = await client.get<ApiResponse<RoomPricingDto[]>>('/Payment/room-pricings');
    return response.data;
  },

  createRoomPricing: async (roomId: number, data: UpdateRoomPricingRequest) => {
    const response = await client.post<ApiResponse<RoomPricingDto>>(`/Payment/room-pricing/${roomId}`, data);
    return response.data;
  },

  updateRoomPricing: async (roomId: number, data: UpdateRoomPricingRequest) => {
    const response = await client.put<ApiResponse<RoomPricingDto>>(`/Payment/room-pricing/${roomId}`, data);
    return response.data;
  },

  deleteRoomPricing: async (pricingId: number) => {
    const response = await client.delete<ApiResponse<any>>(`/Payment/room-pricing/${pricingId}`);
    return response.data;
  }
};

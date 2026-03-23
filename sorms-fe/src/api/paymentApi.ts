import { api } from "@/api/axios";

export const paymentApi = {
  getMyInvoices: () => api.get("/Payment/my-invoices"),
  getAllInvoices: (pageNumber = 1, pageSize = 10) => api.get(`/Payment/all?pageNumber=${pageNumber}&pageSize=${pageSize}`),
  getInvoiceDetail: (invoiceId: string | number) => api.get(`/Payment/invoice/${invoiceId}`),
  createInvoice: (payload: Record<string, unknown>) => api.post("/Payment/create", payload),
  deleteInvoice: (invoiceId: string | number) => api.delete(`/Payment/delete/${invoiceId}`),
  applyVoucher: (invoiceId: string | number, voucherCode: string) =>
    api.post(`/Payment/invoice/${invoiceId}/apply-voucher`, { voucherCode }),
  createPaymentLink: (invoiceId: string | number, payload: { returnUrl?: string; cancelUrl?: string }) =>
    api.post(`/Payment/create-payment-link/${invoiceId}`, payload),
  requestHotelPayment: (invoiceId: string | number) => api.post(`/Payment/payment-at-hotel/${invoiceId}`),
  markInvoicePaid: (invoiceId: string | number) => api.post(`/Payment/mark-paid/${invoiceId}`),
  getPaymentStatus: (invoiceId: string | number) => api.get(`/Payment/payment-status/${invoiceId}`),
  verifyPayment: (orderCode: string | number) => api.post(`/Payment/verify-payment?orderCode=${orderCode}`),
  payosWebhook: (payload: Record<string, unknown>) => api.post("/Payment/payos-webhook", payload),
  getRoomPricing: (roomId: string | number) => api.get(`/Payment/room-pricing/${roomId}`),
  createRoomPricing: (roomId: string | number, payload: Record<string, unknown>) => api.post(`/Payment/room-pricing/${roomId}`, payload),
  updateRoomPricing: (roomId: string | number, payload: Record<string, unknown>) => api.put(`/Payment/room-pricing/${roomId}`, payload),
  getAllRoomPricings: () => api.get("/Payment/room-pricings")
};

import { api } from "@/api/axios";

export const voucherApi = {
  getAll: () => api.get("/Voucher"),
  getById: (id: string | number) => api.get(`/Voucher/${id}`),
  create: (payload: Record<string, unknown>) => api.post("/Voucher", payload),
  update: (id: string | number, payload: Record<string, unknown>) => api.put(`/Voucher/${id}`, payload),
  toggleActive: (id: string | number) => api.patch(`/Voucher/${id}/toggle-active`),
  remove: (id: string | number) => api.delete(`/Voucher/${id}`)
};

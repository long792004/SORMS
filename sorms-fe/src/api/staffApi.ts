import { api } from "@/api/axios";

export const staffApi = {
  getStaffs: () => api.get("/Staff"),
  getStaffDetail: (id: string | number) => api.get(`/Staff/${id}`),
  updateStaff: (id: string | number, payload: Record<string, unknown>) => api.put(`/Staff/${id}`, payload),
  deleteStaff: (id: string | number) => api.delete(`/Staff/${id}`),
  getMe: () => api.get("/Staff/me"),
  updateMe: (payload: Record<string, unknown>) => api.put("/Staff/me", payload),
  createStaff: (payload: Record<string, unknown>) => api.post("/Auth/create-staff", payload)
};

import { api } from "@/api/axios";

export const residentApi = {
  getResidents: () => api.get("/Resident"),
  createResident: (payload: Record<string, unknown>) => api.post("/Resident", payload),
  getResidentById: (id: string | number) => api.get(`/Resident/${id}`),
  updateResidentById: (id: string | number, payload: Record<string, unknown>) => api.put(`/Resident/${id}`, payload),
  deleteResidentById: (id: string | number) => api.delete(`/Resident/${id}`),
  getMyProfile: () => api.get("/Resident/my-profile"),
  updateMyProfile: (payload: Record<string, unknown>) => api.put("/Resident/my-profile", payload),
  getResidentsByRoomId: (roomId: string | number) => api.get(`/Resident/room/${roomId}`),
  checkInResident: (residentId: string | number, date: string) => api.put(`/Resident/${residentId}/checkin?date=${encodeURIComponent(date)}`),
  checkOutResident: (residentId: string | number, date: string) => api.put(`/Resident/${residentId}/checkout?date=${encodeURIComponent(date)}`),
  updateAccount: (payload: { email: string; phone: string }) => api.put("/Resident/update-account", payload),
  updateProfile: (payload: Record<string, unknown>) => api.put("/Resident/update-profile", payload),
  verifyIdentity: (payload: { residentId: number; isVerified: boolean; identityDocumentUrl?: string }) =>
    api.post("/Resident/verify-identity", payload)
};

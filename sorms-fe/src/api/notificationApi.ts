import { api } from "@/api/axios";

export const notificationApi = {
  getMine: () => api.get("/Notification/my-notifications"),
  getStaffMine: () => api.get("/Notification/staff/my-notifications"),
  getSentHistory: () => api.get("/Notification/sent-history"),
  getByResidentId: (residentId: string | number) => api.get(`/Notification/resident/${residentId}`),
  markAsRead: (id: string | number) => api.put(`/Notification/${id}/read`),
  broadcast: (payload: { title?: string; message: string; targetRole?: "All" | "Resident" | "Staff" }) => api.post("/Notification/broadcast", payload),
  individual: (payload: { residentId: number; title?: string; message: string }) => api.post("/Notification/individual", payload)
};

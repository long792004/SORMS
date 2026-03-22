import { api } from "@/api/axios";

export const checkInApi = {
  requestCheckIn: (payload: Record<string, unknown>) => api.post("/CheckIn/request-checkin", payload),
  requestCheckOut: (payload: Record<string, unknown>) => api.post("/CheckIn/request-checkout", payload),
  cancelCheckIn: (payload: Record<string, unknown>) => api.post("/CheckIn/cancel-checkin", payload),
  approveCheckIn: (payload: Record<string, unknown>) => api.post("/CheckIn/approve-checkin", payload),
  approveCheckOut: (payload: Record<string, unknown>) => api.post("/CheckIn/approve-checkout", payload),
  myStatus: () => api.get("/CheckIn/my-status"),
  myHistory: () => api.get("/CheckIn/my-history"),
  pendingCheckIn: () => api.get("/CheckIn/pending-checkin"),
  pendingCheckOut: () => api.get("/CheckIn/pending-checkout"),
  all: () => api.get("/CheckIn/all")
};

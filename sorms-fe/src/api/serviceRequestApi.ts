import { api } from "@/api/axios";

export const serviceRequestApi = {
  getMine: () => api.get("/ServiceRequest/my-requests"),
  getAll: () => api.get("/ServiceRequest"),
  getById: (id: string | number) => api.get(`/ServiceRequest/${id}`),
  getPending: () => api.get("/ServiceRequest/pending"),
  create: (payload: Record<string, unknown>) => api.post("/ServiceRequest", payload),
  update: (id: string | number, payload: Record<string, unknown>) => api.put(`/ServiceRequest/${id}`, payload),
  remove: (id: string | number) => api.delete(`/ServiceRequest/${id}`),
  review: (id: string | number, payload: { status: "Approved" | "InProgress" | "Completed" | "Rejected"; staffFeedback: string }) =>
    api.post(`/ServiceRequest/${id}/review`, payload)
};

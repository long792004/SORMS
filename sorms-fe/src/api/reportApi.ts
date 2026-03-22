import { api } from "@/api/axios";

export const reportApi = {
  createReport: (payload: Record<string, unknown>) => api.post("/Report", payload),
  getReports: () => api.get("/Report"),
  getReportById: (id: string | number) => api.get(`/Report/${id}`),
  updateReport: (id: string | number, payload: Record<string, unknown>) => api.put(`/Report/${id}`, payload),
  deleteReport: (id: string | number) => api.delete(`/Report/${id}`),
  reviewReport: (id: string | number, payload: Record<string, unknown>) => api.post(`/Report/${id}/review`, payload),
  getPendingReports: () => api.get("/Report/pending"),
  createOccupancyReport: (payload: Record<string, unknown>) => api.post("/Report/occupancy", payload),
  createServiceUsageReport: (payload: Record<string, unknown>) => api.post("/Report/service-usage", payload),
  createRevenueReport: (payload: Record<string, unknown>) => api.post("/Report/revenue", payload)
};

import { api } from "@/api/axios";

export const reviewApi = {
  getRoomReviews: (roomId: string | number) => api.get(`/Review/room/${roomId}`),
  getPublicRecent: (limit = 6) => api.get(`/Review/public/recent?limit=${limit}`),
  createReview: (payload: Record<string, unknown>) => api.post("/Review", payload),
  getMyReviews: () => api.get("/Review/my-reviews"),
  getAllForAdmin: () => api.get("/Review/admin/all"),
  deleteReview: (id: string | number) => api.delete(`/Review/${id}`)
};

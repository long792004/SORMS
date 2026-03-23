import { api } from "@/api/axios";

export const roomApi = {
  getRooms: () => api.get("/Room"),
  getRoomDetail: (id: string | number) => api.get(`/Room/${id}`),
  getAvailableRooms: (checkIn?: string, checkOut?: string) => {
    const query = new URLSearchParams();
    if (checkIn) query.set("checkIn", checkIn);
    if (checkOut) query.set("checkOut", checkOut);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/Room/available${suffix}`);
  },
  createRoom: (payload: Record<string, unknown>) => api.post("/Room", payload),
  updateRoom: (id: string | number, payload: Record<string, unknown>) => api.put(`/Room/${id}`, payload),
  deleteRoom: (id: string | number) => api.delete(`/Room/${id}`),
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/Upload/image", formData);
  }
};

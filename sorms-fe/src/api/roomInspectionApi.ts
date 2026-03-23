import { api } from "@/api/axios";

export const roomInspectionApi = {
  create: (payload: Record<string, unknown>) => api.post("/RoomInspection", payload),
  getByCheckInRecord: (checkInRecordId: string | number) => api.get(`/RoomInspection/checkin-record/${checkInRecordId}`)
};

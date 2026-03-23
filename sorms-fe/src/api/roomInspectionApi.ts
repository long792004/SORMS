import { api } from "@/api/axios";

export const roomInspectionApi = {
  createInspection: (payload: {
    checkInRecordId: number;
    furnitureStatus: string;
    equipmentStatus: string;
    roomConditionStatus: string;
    result: string;
    additionalFee: number;
    notes?: string;
  }) => api.post("/RoomInspection", payload),
  getByCheckInRecordId: (checkInRecordId: number) => api.get(`/RoomInspection/checkin-record/${checkInRecordId}`)
};

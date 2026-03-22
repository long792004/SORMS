import client from './client';
import type { ApiResponse, CreateRoomInspectionRequest, RoomInspectionDto } from '../types';

export const roomInspectionApi = {
  create: (data: CreateRoomInspectionRequest) =>
    client.post<ApiResponse<RoomInspectionDto>>('/RoomInspection', data),

  getByCheckInRecordId: (checkInRecordId: number) =>
    client.get<ApiResponse<RoomInspectionDto>>(`/RoomInspection/checkin-record/${checkInRecordId}`),
};

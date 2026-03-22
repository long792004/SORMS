import { useQuery } from "@tanstack/react-query";
import { roomApi } from "@/api/roomApi";
import { reviewApi } from "@/api/reviewApi";

export function useAvailableRooms() {
  return useQuery({
    queryKey: ["rooms", "available"],
    queryFn: async () => {
      const response = await roomApi.getAvailableRooms();
      return response.data?.data ?? response.data;
    }
  });
}

export function useRoomDetail(roomId?: string) {
  return useQuery({
    queryKey: ["room", roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const response = await roomApi.getRoomDetail(roomId!);
      return response.data?.data ?? response.data;
    }
  });
}

export function useRoomReviews(roomId?: string) {
  return useQuery({
    queryKey: ["room-reviews", roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const response = await reviewApi.getRoomReviews(roomId!);
      const payload = response.data?.data ?? response.data;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.reviews)) return payload.reviews;
      if (Array.isArray(payload?.Reviews)) return payload.Reviews;
      return [];
    }
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationApi } from "@/api/notificationApi";
import { useAuthStore } from "@/store/authStore";

export function useMyNotifications() {
  const role = useAuthStore((state) => state.role);

  return useQuery({
    queryKey: ["notifications", "mine", role],
    queryFn: async () => {
      if (role === "Admin") {
        const response = await notificationApi.getSentHistory();
        return response.data?.data ?? response.data;
      }

      if (role === "Staff") {
        const response = await notificationApi.getStaffMine();
        return response.data?.data ?? response.data;
      }

      if (role === "Resident") {
        const response = await notificationApi.getMine();
        return response.data?.data ?? response.data;
      }

      return [];
    },
    enabled: Boolean(role)
  });
}

export function useSentNotificationHistory() {
  return useQuery({
    queryKey: ["notifications", "sent-history"],
    queryFn: async () => {
      const response = await notificationApi.getSentHistory();
      return response.data?.data ?? response.data;
    }
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] });
    }
  });
}

export function useBroadcastNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { message: string; title?: string; targetRole?: "All" | "Resident" | "Staff" }) => notificationApi.broadcast(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "sent-history"] });
    }
  });
}

export function useIndividualNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { residentId: number; title?: string; message: string }) => notificationApi.individual(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "sent-history"] });
    }
  });
}

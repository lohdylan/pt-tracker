import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";

interface NotificationPreferences {
  session_reminders: boolean;
  workout_logged: boolean;
  measurement_recorded: boolean;
  reminder_minutes_before: number;
}

export function useRegisterPushToken() {
  return useMutation({
    mutationFn: (data: { expo_push_token: string; device_name?: string }) =>
      api.post("/notifications/register", data),
  });
}

export function useUnregisterPushToken() {
  return useMutation({
    mutationFn: (expo_push_token: string) =>
      api.post("/notifications/unregister", { expo_push_token }),
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: () => api.get<NotificationPreferences>("/notifications/preferences"),
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) =>
      api.put<NotificationPreferences>("/notifications/preferences", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notificationPreferences"] }),
  });
}

export function useSendTestNotification() {
  return useMutation({
    mutationFn: () => api.post("/notifications/test", {}),
  });
}

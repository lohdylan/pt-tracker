import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { WorkoutLog } from "../types";

export function useWorkoutLogs(sessionId: number) {
  return useQuery({
    queryKey: ["workoutLogs", sessionId],
    queryFn: () => api.get<WorkoutLog[]>(`/sessions/${sessionId}/logs`),
  });
}

export function useCreateWorkoutLog(sessionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WorkoutLog>) =>
      api.post<WorkoutLog>(`/sessions/${sessionId}/logs`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workoutLogs", sessionId] }),
  });
}

export function useUpdateWorkoutLog(sessionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<WorkoutLog> & { id: number }) =>
      api.put<WorkoutLog>(`/sessions/${sessionId}/logs/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workoutLogs", sessionId] }),
  });
}

export function useDeleteWorkoutLog(sessionId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logId: number) => api.del(`/sessions/${sessionId}/logs/${logId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workoutLogs", sessionId] }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Exercise } from "../types";

export function useExercises() {
  return useQuery({
    queryKey: ["exercises"],
    queryFn: () => api.get<Exercise[]>("/exercises"),
  });
}

export function useExercise(id: number) {
  return useQuery({
    queryKey: ["exercises", id],
    queryFn: () => api.get<Exercise>(`/exercises/${id}`),
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Exercise>) =>
      api.post<Exercise>("/exercises", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Exercise> & { id: number }) =>
      api.put<Exercise>(`/exercises/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["exercises"] });
      qc.invalidateQueries({ queryKey: ["exercises", vars.id] });
    },
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/exercises/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exercises"] }),
  });
}

export function useUploadExerciseVideo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, uri }: { id: number; uri: string }) =>
      api.uploadVideo(id, uri),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["exercises"] });
      qc.invalidateQueries({ queryKey: ["exercises", vars.id] });
    },
  });
}

export function useExerciseSearch(query: string) {
  return useQuery({
    queryKey: ["exerciseSearch", query],
    queryFn: () => api.get<Exercise[]>(`/exercises/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
  });
}

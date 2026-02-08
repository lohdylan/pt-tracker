import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { ProgressPhoto } from "../types";

export function useProgressPhotos(clientId: number, category?: string) {
  const queryParam = category ? `?category=${category}` : "";
  return useQuery({
    queryKey: ["progressPhotos", clientId, category],
    queryFn: () =>
      api.get<ProgressPhoto[]>(`/clients/${clientId}/progress-photos${queryParam}`),
  });
}

export function useUploadProgressPhoto(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uri, category, notes }: { uri: string; category: string; notes?: string }) =>
      api.uploadProgressPhoto(clientId, uri, category, notes),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["progressPhotos", clientId] }),
  });
}

export function useDeleteProgressPhoto(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photoId: number) =>
      api.del(`/clients/${clientId}/progress-photos/${photoId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["progressPhotos", clientId] }),
  });
}

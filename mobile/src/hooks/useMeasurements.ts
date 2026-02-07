import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Measurement } from "../types";

export function useMeasurements(clientId: number) {
  return useQuery({
    queryKey: ["measurements", clientId],
    queryFn: () => api.get<Measurement[]>(`/clients/${clientId}/measurements`),
  });
}

export function useCreateMeasurement(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Measurement>) =>
      api.post<Measurement>(`/clients/${clientId}/measurements`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["measurements", clientId] }),
  });
}

export function useUpdateMeasurement(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Measurement> & { id: number }) =>
      api.put<Measurement>(`/clients/${clientId}/measurements/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["measurements", clientId] }),
  });
}

export function useDeleteMeasurement(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (measId: number) =>
      api.del(`/clients/${clientId}/measurements/${measId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["measurements", clientId] }),
  });
}

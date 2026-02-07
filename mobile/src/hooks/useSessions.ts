import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Session } from "../types";

export function useSessions(params?: { from?: string; to?: string; client_id?: number }) {
  const qs = new URLSearchParams();
  if (params?.from) qs.set("from", params.from);
  if (params?.to) qs.set("to", params.to);
  if (params?.client_id) qs.set("client_id", String(params.client_id));
  const query = qs.toString();
  return useQuery({
    queryKey: ["sessions", params],
    queryFn: () => api.get<Session[]>(`/sessions${query ? `?${query}` : ""}`),
  });
}

export function useSession(id: number) {
  return useQuery({
    queryKey: ["sessions", id],
    queryFn: () => api.get<Session>(`/sessions/${id}`),
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Session>) => api.post<Session>("/sessions", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Session> & { id: number }) =>
      api.put<Session>(`/sessions/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["sessions", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.del(`/sessions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import type { Message, Conversation } from "../types";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => api.get<Conversation[]>("/messages/conversations"),
    refetchInterval: 30000,
  });
}

export function useMessages(clientId: number) {
  return useQuery({
    queryKey: ["messages", clientId],
    queryFn: () => api.get<Message[]>(`/messages/conversations/${clientId}`),
    refetchInterval: 10000,
  });
}

export function useSendMessage(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      api.post<Message>(`/messages/conversations/${clientId}`, { content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", clientId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkAsRead(clientId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.put(`/messages/conversations/${clientId}/read`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["unreadCount"] });
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unreadCount"],
    queryFn: () => api.get<{ count: number }>("/messages/unread-count"),
    refetchInterval: 30000,
  });
}

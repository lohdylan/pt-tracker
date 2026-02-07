import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { DashboardData } from "../types";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/analytics/dashboard"),
    refetchInterval: 60_000,
  });
}

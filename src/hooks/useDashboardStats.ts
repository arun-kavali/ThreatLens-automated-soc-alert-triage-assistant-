import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalAlerts: number;
  criticalAlerts: number;
  openIncidents: number;
  resolvedToday: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [alertsResult, criticalResult, incidentsResult, resolvedResult] = await Promise.all([
        supabase.from("alerts").select("id", { count: "exact", head: true }),
        supabase.from("alerts").select("id", { count: "exact", head: true }).eq("severity", "Critical"),
        supabase.from("incidents").select("id", { count: "exact", head: true }).in("status", ["Open", "In Progress"]),
        // Count incidents resolved today using resolved_at timestamp
        supabase.from("incidents").select("id", { count: "exact", head: true }).eq("status", "Resolved").gte("resolved_at", today.toISOString()),
      ]);

      return {
        totalAlerts: alertsResult.count ?? 0,
        criticalAlerts: criticalResult.count ?? 0,
        openIncidents: incidentsResult.count ?? 0,
        resolvedToday: resolvedResult.count ?? 0,
      };
    },
    refetchInterval: 30000,
  });
}

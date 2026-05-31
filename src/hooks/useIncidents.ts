import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Incident = Tables<"incidents"> & {
  resolved_at?: string | null;
};

export function useIncidents(limit?: number) {
  return useQuery({
    queryKey: ["incidents", limit],
    queryFn: async () => {
      let query = supabase
        .from("incidents")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Incident[];
    },
    refetchInterval: 30000,
  });
}

export function useActiveIncidents(limit?: number) {
  return useQuery({
    queryKey: ["active-incidents", limit],
    queryFn: async () => {
      let query = supabase
        .from("incidents")
        .select("*")
        .in("status", ["Open", "In Progress"])
        .order("created_at", { ascending: false });
      
      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Incident[];
    },
    refetchInterval: 30000,
  });
}

export function useIncidentsByStatus() {
  return useQuery({
    queryKey: ["incidents-by-status"],
    queryFn: async () => {
      const { data, error } = await supabase.from("incidents").select("status");
      if (error) throw error;

      const counts: Record<string, number> = { Open: 0, "In Progress": 0, Resolved: 0, Closed: 0 };
      data?.forEach((incident) => {
        counts[incident.status] = (counts[incident.status] || 0) + 1;
      });

      return Object.entries(counts).map(([status, count]) => ({
        status,
        count,
      }));
    },
    refetchInterval: 30000,
  });
}

export function useIncidentAlerts(incidentId: string) {
  return useQuery({
    queryKey: ["incident-alerts", incidentId],
    queryFn: async () => {
      const { data: mappings, error: mappingError } = await supabase
        .from("alert_incident_map")
        .select("alert_id")
        .eq("incident_id", incidentId);

      if (mappingError) throw mappingError;
      if (!mappings || mappings.length === 0) return [];

      const alertIds = mappings.map((m) => m.alert_id);
      const { data: alerts, error: alertsError } = await supabase
        .from("alerts")
        .select("*")
        .in("id", alertIds);

      if (alertsError) throw alertsError;
      return alerts;
    },
    enabled: !!incidentId,
  });
}

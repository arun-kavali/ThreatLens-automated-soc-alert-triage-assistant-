import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

export interface IncidentActivity {
  id: string;
  incident_id: string;
  user_id: string;
  action_type: string;
  action_label: string;
  is_demo: boolean;
  created_at: string;
  metadata: Json;
}

export type ActionType = "block_ip" | "disable_user" | "confirm_containment" | "start_investigation" | "resolve";

export function useIncidentActivity(incidentId: string) {
  return useQuery({
    queryKey: ["incident-activity", incidentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incident_activity")
        .select("*")
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as IncidentActivity[];
    },
    enabled: !!incidentId,
  });
}

export function useLogIncidentAction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      incidentId,
      actionType,
      actionLabel,
      metadata = {},
    }: {
      incidentId: string;
      actionType: ActionType;
      actionLabel: string;
      metadata?: Json;
    }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("incident_activity")
        .insert([{
          incident_id: incidentId,
          user_id: user.id,
          action_type: actionType,
          action_label: actionLabel,
          is_demo: true,
          metadata,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incident-activity", variables.incidentId] });
    },
  });
}

export function useStartInvestigation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (incidentId: string) => {
      if (!user) throw new Error("User not authenticated");

      // Update incident status to In Progress
      const { error: incidentError } = await supabase
        .from("incidents")
        .update({
          status: "In Progress",
        })
        .eq("id", incidentId);

      if (incidentError) throw incidentError;

      // Log the action
      const { error: activityError } = await supabase
        .from("incident_activity")
        .insert([{
          incident_id: incidentId,
          user_id: user.id,
          action_type: "start_investigation",
          action_label: "Investigation started",
          is_demo: false,
          metadata: { started_by: user.email },
        }]);

      if (activityError) throw activityError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["active-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incidents-by-status"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useResolveIncident() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (incidentId: string) => {
      if (!user) throw new Error("User not authenticated");

      // Update incident status to Resolved
      const { error: incidentError } = await supabase
        .from("incidents")
        .update({
          status: "Resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", incidentId);

      if (incidentError) throw incidentError;

      // Log the resolve action
      const { error: activityError } = await supabase
        .from("incident_activity")
        .insert([{
          incident_id: incidentId,
          user_id: user.id,
          action_type: "resolve",
          action_label: "Incident resolved",
          is_demo: false,
          metadata: { resolved_by: user.email },
        }]);

      if (activityError) throw activityError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({ queryKey: ["active-incidents"] });
      queryClient.invalidateQueries({ queryKey: ["incidents-by-status"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

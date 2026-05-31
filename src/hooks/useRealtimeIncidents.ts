import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to subscribe to real-time incident changes.
 * Automatically invalidates relevant queries when incidents are created, updated, or deleted.
 */
export function useRealtimeIncidents() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("incidents-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "incidents",
        },
        () => {
          // Invalidate all incident-related queries immediately
          queryClient.invalidateQueries({ queryKey: ["incidents"] });
          queryClient.invalidateQueries({ queryKey: ["active-incidents"] });
          queryClient.invalidateQueries({ queryKey: ["incidents-by-status"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alerts",
        },
        () => {
          // Invalidate all alert-related queries immediately
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          queryClient.invalidateQueries({ queryKey: ["alerts-by-severity"] });
          queryClient.invalidateQueries({ queryKey: ["alerts-by-source"] });
          queryClient.invalidateQueries({ queryKey: ["alerts-over-time"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

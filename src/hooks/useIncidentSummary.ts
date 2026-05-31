import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface SummaryResult {
  summary: string;
  ai_used: boolean;
  cached: boolean;
}

interface UseIncidentSummaryResult {
  summary: string | null;
  isLoading: boolean;
  isAIUsed: boolean;
  error: string | null;
  generateSummary: (incidentId: string) => Promise<void>;
  reset: () => void;
}

export function useIncidentSummary(incidentId: string | undefined, initialSummary?: string | null): UseIncidentSummaryResult {
  const [summary, setSummary] = useState<string | null>(initialSummary || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAIUsed, setIsAIUsed] = useState(!initialSummary?.includes("[Rule-based analysis"));
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Reset state when incident changes
  useEffect(() => {
    setSummary(initialSummary || null);
    setIsAIUsed(!initialSummary?.includes("[Rule-based analysis"));
    setError(null);
  }, [incidentId, initialSummary]);

  const reset = useCallback(() => {
    setSummary(null);
    setIsLoading(false);
    setIsAIUsed(false);
    setError(null);
  }, []);

  const generateSummary = useCallback(async (incidentIdToGenerate: string) => {
    if (isLoading) return; // Prevent duplicate calls
    
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      console.log("Generating AI summary for incident:", incidentIdToGenerate);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-incident-summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ incidentId: incidentIdToGenerate }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
      }

      const result: SummaryResult = await response.json();
      console.log("AI summary received:", result.cached ? "from cache" : "newly generated");
      
      setSummary(result.summary);
      setIsAIUsed(result.ai_used);

      // Invalidate incidents query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate summary";
      setError(errorMessage);
      console.error("Error generating incident summary:", err);
    } finally {
      setIsLoading(false);
    }
  }, [queryClient, isLoading]);

  return {
    summary,
    isLoading,
    isAIUsed,
    error,
    generateSummary,
    reset,
  };
}

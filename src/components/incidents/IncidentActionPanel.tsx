import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, UserX, CheckCircle2, AlertTriangle, Search } from "lucide-react";
import { useLogIncidentAction, useResolveIncident, useStartInvestigation, ActionType } from "@/hooks/useIncidentActivity";
import { toast } from "@/hooks/use-toast";

interface IncidentActionPanelProps {
  incidentId: string;
  incidentStatus: string;
  onResolved?: () => void;
  onStatusChange?: () => void;
}

const DEMO_ACTIONS: { type: ActionType; label: string; icon: typeof Shield; description: string }[] = [
  {
    type: "block_ip",
    label: "Block IP",
    icon: Shield,
    description: "Block the source IP address at the firewall",
  },
  {
    type: "disable_user",
    label: "Disable User",
    icon: UserX,
    description: "Disable the compromised user account",
  },
  {
    type: "confirm_containment",
    label: "Confirm Containment",
    icon: CheckCircle2,
    description: "Confirm threat has been contained",
  },
];

export function IncidentActionPanel({ incidentId, incidentStatus, onResolved, onStatusChange }: IncidentActionPanelProps) {
  const [loadingAction, setLoadingAction] = useState<ActionType | null>(null);
  const logAction = useLogIncidentAction();
  const resolveIncident = useResolveIncident();
  const startInvestigation = useStartInvestigation();

  const isResolved = incidentStatus === "Resolved" || incidentStatus === "Closed";
  const isOpen = incidentStatus === "Open";
  const isInProgress = incidentStatus === "In Progress";

  const handleAction = async (actionType: ActionType, actionLabel: string) => {
    setLoadingAction(actionType);
    try {
      await logAction.mutateAsync({
        incidentId,
        actionType,
        actionLabel,
        metadata: { simulated: true, timestamp: new Date().toISOString() },
      });
      toast({
        title: "Action Logged",
        description: `"${actionLabel}" has been logged as a simulated action.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log action",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResolve = async () => {
    setLoadingAction("resolve");
    try {
      await resolveIncident.mutateAsync(incidentId);
      toast({
        title: "Incident Resolved",
        description: "The incident has been marked as resolved.",
      });
      onResolved?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve incident",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStartInvestigation = async () => {
    setLoadingAction("start_investigation");
    try {
      await startInvestigation.mutateAsync(incidentId);
      toast({
        title: "Investigation Started",
        description: "The incident status has been updated to In Progress.",
      });
      onStatusChange?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start investigation",
        variant: "destructive",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Action Panel
          <span className="text-xs font-normal text-muted-foreground ml-2">(Demo Actions)</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMO_ACTIONS.map((action) => (
            <Button
              key={action.type}
              variant="outline"
              className="flex flex-col items-center gap-2 h-auto py-4 hover:border-primary hover:bg-primary/5"
              onClick={() => handleAction(action.type, action.label)}
              disabled={isResolved || loadingAction !== null}
            >
              <action.icon className="h-5 w-5" />
              <span className="font-medium">{action.label}</span>
              <span className="text-xs text-muted-foreground text-center">{action.description}</span>
            </Button>
          ))}
        </div>

        <div className="pt-3 border-t space-y-2">
          {isOpen && (
            <Button
              className="w-full"
              variant="outline"
              onClick={handleStartInvestigation}
              disabled={loadingAction === "start_investigation"}
            >
              {loadingAction === "start_investigation" ? (
                "Starting..."
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Start Investigation
                </>
              )}
            </Button>
          )}
          <Button
            className="w-full"
            variant={isResolved ? "secondary" : "default"}
            onClick={handleResolve}
            disabled={isResolved || loadingAction === "resolve"}
          >
            {loadingAction === "resolve" ? (
              "Resolving..."
            ) : isResolved ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Already Resolved
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Resolve Incident
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

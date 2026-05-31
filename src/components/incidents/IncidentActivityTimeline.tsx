import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIncidentActivity } from "@/hooks/useIncidentActivity";
import { Clock, Shield, UserX, CheckCircle2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface IncidentActivityTimelineProps {
  incidentId: string;
}

const ACTION_ICONS: Record<string, typeof Shield> = {
  block_ip: Shield,
  disable_user: UserX,
  confirm_containment: CheckCircle2,
  resolve: CheckCircle2,
};

const ACTION_COLORS: Record<string, string> = {
  block_ip: "text-orange-500",
  disable_user: "text-destructive",
  confirm_containment: "text-primary",
  resolve: "text-primary",
};

export function IncidentActivityTimeline({ incidentId }: IncidentActivityTimelineProps) {
  const { data: activities, isLoading } = useIncidentActivity(incidentId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No actions taken yet. Use the Action Panel above to log containment actions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Activity Timeline ({activities.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = ACTION_ICONS[activity.action_type] || AlertCircle;
            const colorClass = ACTION_COLORS[activity.action_type] || "text-muted-foreground";

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 relative"
              >
                {/* Timeline line */}
                {index < activities.length - 1 && (
                  <div className="absolute left-[11px] top-6 w-0.5 h-[calc(100%+12px)] bg-border" />
                )}

                {/* Icon */}
                <div className={`p-1.5 rounded-full bg-muted ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{activity.action_label}</span>
                    {activity.is_demo && (
                      <Badge variant="outline" className="text-xs px-1.5 py-0">
                        Demo
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

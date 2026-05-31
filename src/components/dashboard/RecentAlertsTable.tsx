import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlerts } from "@/hooks/useAlerts";
import { AlertTriangle, Bot, Cpu } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-orange-500 text-white",
  Medium: "bg-yellow-500 text-black",
  Low: "bg-primary text-primary-foreground",
};

export function RecentAlertsTable() {
  const { data: alerts, isLoading } = useAlerts(5);
  const navigate = useNavigate();

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Alerts</CardTitle>
        <button
          onClick={() => navigate("/alerts")}
          className="text-sm text-primary hover:underline"
        >
          View all
        </button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : !alerts || alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
            <p>No alerts to display</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>AI</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow
                  key={alert.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/alerts?id=${alert.id}`)}
                >
                  <TableCell className="font-medium">{alert.alert_type}</TableCell>
                  <TableCell>
                    <Badge className={SEVERITY_COLORS[alert.severity]}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {alert.source_system}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {alert.ai_used ? (
                      <Bot className="h-4 w-4 text-primary" />
                    ) : (
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useActiveIncidents } from "@/hooks/useIncidents";
import { FileWarning, Bot, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-orange-500 text-white",
  Medium: "bg-yellow-500 text-black",
  Low: "bg-primary text-primary-foreground",
};

const STATUS_COLORS: Record<string, string> = {
  Open: "bg-destructive/20 text-destructive border-destructive",
  "In Progress": "bg-yellow-500/20 text-yellow-700 border-yellow-500",
  Resolved: "bg-primary/20 text-primary border-primary",
  Closed: "bg-muted text-muted-foreground border-muted",
};

export function ActiveIncidentsTable() {
  const { data: incidents, isLoading } = useActiveIncidents(5);
  const navigate = useNavigate();

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Active Incidents</CardTitle>
        <button
          onClick={() => navigate("/incidents")}
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
        ) : !incidents || incidents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <FileWarning className="h-12 w-12 mb-4 opacity-50" />
            <p>No active incidents</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reason</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Auto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow
                  key={incident.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/incidents?id=${incident.id}`)}
                >
                  <TableCell className="font-medium max-w-48 truncate">
                    {incident.incident_reason || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge className={SEVERITY_COLORS[incident.severity]}>
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[incident.status]}>
                      {incident.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {incident.auto_created ? (
                      <Zap className="h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-muted-foreground text-xs">Manual</span>
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

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Bot, Cpu, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAlerts, Alert } from "@/hooks/useAlerts";
import { AlertDetailModal } from "@/components/alerts/AlertDetailModal";
import { formatDistanceToNow } from "date-fns";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-orange-500 text-white",
  Medium: "bg-yellow-500 text-black",
  Low: "bg-primary text-primary-foreground",
};

const STATUS_COLORS: Record<string, string> = {
  New: "bg-info/20 text-info border-info",
  Reviewed: "bg-yellow-500/20 text-yellow-700 border-yellow-500",
  Correlated: "bg-primary/20 text-primary border-primary",
};

export default function Alerts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: alerts, isLoading } = useAlerts();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Handle URL param for opening specific alert
  useEffect(() => {
    const alertId = searchParams.get("id");
    if (alertId && alerts) {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        setSelectedAlert(alert);
        setModalOpen(true);
        setSearchParams({});
      }
    }
  }, [alerts, searchParams, setSearchParams]);

  const filteredAlerts = alerts?.filter((alert) => {
    const matchesSearch =
      alert.alert_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.source_system.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Alerts</h1>
        <p className="text-muted-foreground">View and analyze security alerts</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by type or source..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="New">New</SelectItem>
            <SelectItem value="Reviewed">Reviewed</SelectItem>
            <SelectItem value="Correlated">Correlated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            All Alerts ({filteredAlerts?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !filteredAlerts || filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No alerts to display</p>
              <p className="text-sm">Alerts will appear here once they are ingested</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Risk Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>AI</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlerts.map((alert) => (
                    <TableRow
                      key={alert.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleAlertClick(alert)}
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
                      <TableCell>
                        {alert.risk_score !== null ? (
                          <span className={`font-medium ${alert.risk_score >= 70 ? "text-destructive" : alert.risk_score >= 40 ? "text-warning" : "text-primary"}`}>
                            {alert.risk_score}/100
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_COLORS[alert.status]}>
                          {alert.status}
                        </Badge>
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
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDetailModal
        alert={selectedAlert}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}

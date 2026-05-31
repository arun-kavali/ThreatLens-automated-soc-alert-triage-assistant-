import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { FileWarning, Zap, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIncidents, Incident } from "@/hooks/useIncidents";
import { IncidentDetailModal } from "@/components/incidents/IncidentDetailModal";
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

export default function Incidents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: incidents, isLoading } = useIncidents();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Handle URL param for opening specific incident
  useEffect(() => {
    const incidentId = searchParams.get("id");
    if (incidentId && incidents) {
      const incident = incidents.find((i) => i.id === incidentId);
      if (incident) {
        setSelectedIncident(incident);
        setModalOpen(true);
        setSearchParams({});
      }
    }
  }, [incidents, searchParams, setSearchParams]);

  const filteredIncidents = incidents?.filter((incident) => {
    const matchesSearch =
      incident.incident_reason?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesSeverity = severityFilter === "all" || incident.severity === severityFilter;
    const matchesStatus = statusFilter === "all" || incident.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const handleIncidentClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Incidents</h1>
        <p className="text-muted-foreground">View correlated security incidents</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by reason..."
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
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incidents Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-info" />
            All Incidents ({filteredIncidents?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : !filteredIncidents || filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <FileWarning className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No incidents to display</p>
              <p className="text-sm">Incidents will be created when alerts are correlated</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Auto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIncidents.map((incident) => (
                    <TableRow
                      key={incident.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleIncidentClick(incident)}
                    >
                      <TableCell className="font-medium max-w-64 truncate">
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
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(incident.updated_at), { addSuffix: true })}
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
            </div>
          )}
        </CardContent>
      </Card>

      <IncidentDetailModal
        incident={selectedIncident}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}

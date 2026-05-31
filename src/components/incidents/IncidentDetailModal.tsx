import { useEffect, useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Incident, useIncidentAlerts } from "@/hooks/useIncidents";
import { useIncidentSummary } from "@/hooks/useIncidentSummary";
import { FileWarning, Zap, Bot, Cpu, AlertTriangle, Network, Loader2, Clock } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { AIIncidentSummary } from "./AIIncidentSummary";
import { IncidentActionPanel } from "./IncidentActionPanel";
import { IncidentActivityTimeline } from "./IncidentActivityTimeline";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

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

interface IncidentDetailModalProps {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function extractIP(rawLog: unknown): string {
  if (!rawLog || typeof rawLog !== "object") return "N/A";
  const log = rawLog as Record<string, unknown>;
  return (log.source_ip as string) || (log.ip as string) || (log.ip_address as string) || "N/A";
}

// Parse correlation metadata from incident_reason
function parseCorrelationMeta(reason: string | null) {
  if (!reason) return { cleanReason: "Unknown", drivers: [], rule: "", priority: "" };
  const parts = reason.split("|").map(s => s.trim());
  const cleanReason = parts[0] || "Unknown";
  const driversMatch = reason.match(/Drivers:\s*([^|]+)/);
  const ruleMatch = reason.match(/Rule:\s*(\w+)/);
  const priorityMatch = reason.match(/Priority:\s*(P\d)/);
  return {
    cleanReason,
    drivers: driversMatch ? driversMatch[1].trim().split(", ") : [],
    rule: ruleMatch ? ruleMatch[1] : "",
    priority: priorityMatch ? priorityMatch[1] : "",
  };
}

function formatRule(rule: string): string {
  const map: Record<string, string> = {
    credential_attack: "Credential Attack Detection",
    ip_correlation: "IP-Based Correlation",
    user_correlation: "User-Based Correlation",
    asset_correlation: "Asset-Based Correlation",
    phishing_detection: "Phishing Campaign Detection",
    risk_threshold: "Risk Score Threshold",
    malware_detection: "Malware Detection",
    insider_threat: "Insider Threat Detection",
  };
  return map[rule] || rule || "Auto-Correlation";
}

// Compute attack timeline from correlated alerts
function computeAttackTimeline(alerts: any[] | undefined) {
  if (!alerts || alerts.length === 0) return [];
  return alerts
    .map(a => ({
      timestamp: new Date(a.timestamp),
      type: a.alert_type,
      source: a.source_system,
      severity: a.severity,
      ip: extractIP(a.raw_log),
    }))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function IncidentDetailModal({ incident, open, onOpenChange }: IncidentDetailModalProps) {
  const { data: correlatedAlerts, isLoading: alertsLoading } = useIncidentAlerts(incident?.id || "");
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const [localStatus, setLocalStatus] = useState(incident?.status || "Open");

  const { summary, isLoading: summaryLoading, isAIUsed, error: summaryError, generateSummary } = useIncidentSummary(
    incident?.id,
    incident?.ai_summary
  );

  const isAnalyst = role === "analyst";

  const correlationMeta = useMemo(() => parseCorrelationMeta(incident?.incident_reason || null), [incident?.incident_reason]);
  const attackTimeline = useMemo(() => computeAttackTimeline(correlatedAlerts), [correlatedAlerts]);

  const hasStructuredFormat = (text: string | null | undefined) => {
    return text && text.includes("ATTACK PATTERN:") && text.includes("BUSINESS IMPACT:");
  };

  useEffect(() => {
    if (!incident || !open || !isAnalyst) return;
    const existingSummary = summary || incident.ai_summary;
    const needsSummary = !hasStructuredFormat(existingSummary);
    const isInvestigating = localStatus === "In Progress" || localStatus === "Resolved" || localStatus === "Closed";
    if (needsSummary && isInvestigating && !summaryLoading) {
      generateSummary(incident.id);
    }
  }, [incident?.id, open, isAnalyst, incident?.ai_summary, summary, localStatus, summaryLoading, generateSummary]);

  if (!incident) return null;

  const handleStatusChange = async () => {
    setLocalStatus("In Progress");
    if (!incident.ai_summary && !summary) {
      await generateSummary(incident.id);
    }
    queryClient.invalidateQueries({ queryKey: ["incidents"] });
  };

  const handleResolved = () => {
    setLocalStatus("Resolved");
    queryClient.invalidateQueries({ queryKey: ["incidents"] });
  };

  const displaySummary = summary || incident.ai_summary;
  const hasValidSummary = hasStructuredFormat(displaySummary);
  const showAISummary = isAnalyst && (localStatus === "In Progress" || localStatus === "Resolved" || localStatus === "Closed");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="incident-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileWarning className="h-5 w-5 text-info" />
            Incident Details
          </DialogTitle>
          <DialogDescription id="incident-description">
            View incident details, AI analysis, and take containment actions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={SEVERITY_COLORS[incident.severity]}>{incident.severity}</Badge>
            <Badge variant="outline" className={STATUS_COLORS[localStatus]}>{localStatus}</Badge>
            {incident.auto_created && (
              <Badge variant="outline" className="flex items-center gap-1 border-primary">
                <Zap className="h-3 w-3" /> Auto-created
              </Badge>
            )}
            {correlationMeta.priority && (
              <Badge variant="outline" className={
                correlationMeta.priority === "P1" ? "border-destructive text-destructive"
                : correlationMeta.priority === "P2" ? "border-orange-500 text-orange-600"
                : "border-muted-foreground text-muted-foreground"
              }>
                {correlationMeta.priority}
              </Badge>
            )}
          </div>

          {/* Incident Info with Correlation Metadata */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Incident Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reason:</span>
                <span className="font-medium text-right max-w-md">{correlationMeta.cleanReason}</span>
              </div>
              {correlationMeta.rule && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trigger Rule:</span>
                  <span className="font-medium">{formatRule(correlationMeta.rule)}</span>
                </div>
              )}
              {correlationMeta.drivers.length > 0 && (
                <div>
                  <span className="text-muted-foreground">Correlation Drivers:</span>
                  <div className="flex flex-wrap gap-1 mt-1 justify-end">
                    {correlationMeta.drivers.map((d, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{d}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">{format(new Date(incident.created_at), "PPpp")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated:</span>
                <span className="font-medium">{formatDistanceToNow(new Date(incident.updated_at), { addSuffix: true })}</span>
              </div>
              {incident.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Resolved At:</span>
                  <span className="font-medium text-primary">{format(new Date(incident.resolved_at), "PPpp")}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attack Timeline */}
          {attackTimeline.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Attack Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {attackTimeline.map((event, index) => (
                    <div key={index} className="flex items-start gap-3 relative">
                      {index < attackTimeline.length - 1 && (
                        <div className="absolute left-[7px] top-4 w-0.5 h-[calc(100%+8px)] bg-border" />
                      )}
                      <div className={`w-3.5 h-3.5 rounded-full mt-0.5 shrink-0 ${
                        event.severity === "Critical" ? "bg-destructive" :
                        event.severity === "High" ? "bg-orange-500" :
                        event.severity === "Medium" ? "bg-yellow-500" : "bg-primary"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{event.type}</span>
                          <Badge variant="outline" className="text-xs">{event.source}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(event.timestamp, "HH:mm:ss")} · {event.ip !== "N/A" ? event.ip : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Summary Section */}
          {isAnalyst && showAISummary && (
            <>
              {summaryLoading ? (
                <Card className="border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Generating AI Incident Intelligence...
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ) : hasValidSummary && displaySummary ? (
                <AIIncidentSummary summary={displaySummary} isAIUsed={isAIUsed} />
              ) : summaryError ? (
                <Card className="border-destructive/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      AI Intelligence temporarily unavailable.
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{summaryError}</p>
                    <button
                      onClick={() => generateSummary(incident.id)}
                      className="text-sm text-primary hover:underline"
                    >
                      Retry
                    </button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-primary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      AI Incident Intelligence
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Generating structured AI analysis...</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Prompt to start investigation */}
          {isAnalyst && localStatus === "Open" && (
            <Card className="border-info/30 bg-info/5">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <Bot className="h-5 w-5 text-info" />
                  <p className="text-sm text-foreground">
                    Click <strong>"Start Investigation"</strong> below to generate AI Incident Intelligence with attack patterns, business impact, and containment steps.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Panel */}
          {isAnalyst && (
            <IncidentActionPanel
              incidentId={incident.id}
              incidentStatus={localStatus}
              onResolved={handleResolved}
              onStatusChange={handleStatusChange}
            />
          )}

          {/* Activity Timeline */}
          {isAnalyst && <IncidentActivityTimeline incidentId={incident.id} />}

          {/* Correlated Alerts */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Correlated Alerts ({correlatedAlerts?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="h-10 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : !correlatedAlerts || correlatedAlerts.length === 0 ? (
                <p className="text-muted-foreground text-sm">No correlated alerts found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>
                          <div className="flex items-center gap-1">
                            <Network className="h-3 w-3" />IP
                          </div>
                        </TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>AI</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {correlatedAlerts.map((alert) => (
                        <TableRow key={alert.id}>
                          <TableCell className="font-medium">{alert.alert_type}</TableCell>
                          <TableCell className="text-muted-foreground">{alert.source_system}</TableCell>
                          <TableCell className="font-mono text-xs">{extractIP(alert.raw_log)}</TableCell>
                          <TableCell>
                            <Badge className={SEVERITY_COLORS[alert.severity]} variant="secondary">
                              {alert.severity}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}

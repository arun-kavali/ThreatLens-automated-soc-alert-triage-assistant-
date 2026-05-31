import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/hooks/useAlerts";
import { Bot, Cpu, AlertTriangle, ShieldCheck, Lightbulb, BarChart3, ShieldAlert, Server, ListChecks } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-orange-500 text-white",
  Medium: "bg-yellow-500 text-black",
  Low: "bg-primary text-primary-foreground",
};

interface AlertDetailModalProps {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedAnalysis {
  whatHappened: string;
  whyRisky: string;
  recommendation: string;
  assetCriticality: string;
  impactNote: string;
  confidenceScore: string;
  confidenceInterpretation: string;
  falsePositiveLikelihood: string;
  falsePositiveRationale: string;
  analystGuidance: string[];
  isRuleBased: boolean;
}

function parseAnalysis(analysis: string | null): ParsedAnalysis {
  const result: ParsedAnalysis = {
    whatHappened: "", whyRisky: "", recommendation: "",
    assetCriticality: "", impactNote: "",
    confidenceScore: "", confidenceInterpretation: "",
    falsePositiveLikelihood: "", falsePositiveRationale: "",
    analystGuidance: [],
    isRuleBased: false,
  };

  if (!analysis) return result;

  result.isRuleBased = analysis.includes("[Rule-based analysis");

  const get = (pattern: RegExp) => pattern.exec(analysis)?.[1]?.trim() || "";

  result.whatHappened = get(/WHAT HAPPENED:\s*([\s\S]*?)(?=WHY IT'S RISKY:|$)/i);
  result.whyRisky = get(/WHY IT'S RISKY:\s*([\s\S]*?)(?=RECOMMENDED ACTION:|$)/i);
  result.recommendation = get(/RECOMMENDED ACTION:\s*([\s\S]*?)(?=RISK SCORE:|$)/i);
  result.assetCriticality = get(/ASSET CRITICALITY:\s*(.+)/i);
  result.impactNote = get(/IMPACT NOTE:\s*(.+)/i);
  result.confidenceScore = get(/CONFIDENCE SCORE:\s*(.+)/i);
  result.confidenceInterpretation = get(/INTERPRETATION:\s*(.+)/i);
  result.falsePositiveLikelihood = get(/FALSE POSITIVE LIKELIHOOD:\s*(.+)/i);
  result.falsePositiveRationale = get(/RATIONALE:\s*(.+)/i);

  // Parse analyst guidance
  const guidanceMatch = analysis.match(/ANALYST GUIDANCE:\s*([\s\S]*?)(?=\[Rule-based|$)/i);
  if (guidanceMatch) {
    result.analystGuidance = guidanceMatch[1]
      .split('\n')
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
      .filter(l => l.length > 0);
  }

  return result;
}

function getConfidenceBadge(score: string) {
  const num = parseInt(score);
  if (num >= 80) return "bg-primary/20 text-primary border-primary";
  if (num >= 50) return "bg-yellow-500/20 text-yellow-700 border-yellow-500";
  return "bg-destructive/20 text-destructive border-destructive";
}

function getFPBadge(level: string) {
  if (level.includes("Low")) return "bg-primary/20 text-primary border-primary";
  if (level.includes("Medium")) return "bg-yellow-500/20 text-yellow-700 border-yellow-500";
  return "bg-destructive/20 text-destructive border-destructive";
}

function getCriticalityBadge(level: string) {
  if (level.includes("Critical")) return "bg-destructive text-destructive-foreground";
  if (level.includes("High")) return "bg-orange-500 text-white";
  if (level.includes("Medium")) return "bg-yellow-500 text-black";
  return "bg-primary text-primary-foreground";
}

export function AlertDetailModal({ alert, open, onOpenChange }: AlertDetailModalProps) {
  if (!alert) return null;

  const analysis = parseAnalysis(alert.ai_analysis);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Alert Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={SEVERITY_COLORS[alert.severity]}>{alert.severity}</Badge>
            {alert.risk_score !== null && (
              <Badge variant="outline" className="border-primary">
                Risk Score: {alert.risk_score}/100
              </Badge>
            )}
            <Badge variant="outline" className="flex items-center gap-1">
              {alert.ai_used ? (
                <><Bot className="h-3 w-3" /> AI Analysis</>
              ) : (
                <><Cpu className="h-3 w-3" /> Rule-based</>
              )}
            </Badge>
            {analysis.assetCriticality && (
              <Badge className={getCriticalityBadge(analysis.assetCriticality)}>
                Asset: {analysis.assetCriticality}
              </Badge>
            )}
          </div>

          {/* Alert Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Alert Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{alert.alert_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Source:</span>
                <span className="font-medium">{alert.source_system}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">{alert.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timestamp:</span>
                <span className="font-medium">
                  {format(new Date(alert.timestamp), "PPpp")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Ago:</span>
                <span className="font-medium">
                  {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
                </span>
              </div>
              {analysis.impactNote && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Impact:</span>
                  <span className="font-medium text-right max-w-xs">{analysis.impactNote}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Analysis */}
          {alert.ai_analysis && (
            <div className="space-y-3">
              {analysis.whatHappened && (
                <Card className="border-info/30 bg-info/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-info" />
                      What Happened
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysis.whatHappened}</p>
                  </CardContent>
                </Card>
              )}

              {analysis.whyRisky && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-destructive" />
                      Why It's Risky
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysis.whyRisky}</p>
                  </CardContent>
                </Card>
              )}

              {analysis.recommendation && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      Recommended Action
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysis.recommendation}</p>
                  </CardContent>
                </Card>
              )}

              {/* Analyst Guidance */}
              {analysis.analystGuidance.length > 0 && (
                <Card className="border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-foreground" />
                      Analyst Guidance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      {analysis.analystGuidance.map((step, i) => (
                        <li key={i} className="text-foreground/90">{step}</li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {/* Confidence & FP */}
              {(analysis.confidenceScore || analysis.falsePositiveLikelihood) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysis.confidenceScore && (
                    <Card className="border-border">
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Confidence
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Badge variant="outline" className={getConfidenceBadge(analysis.confidenceScore)}>
                          {analysis.confidenceScore}
                        </Badge>
                        {analysis.confidenceInterpretation && (
                          <p className="text-xs text-muted-foreground mt-1">{analysis.confidenceInterpretation}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                  {analysis.falsePositiveLikelihood && (
                    <Card className="border-border">
                      <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ShieldAlert className="h-4 w-4" />
                          False Positive
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <Badge variant="outline" className={getFPBadge(analysis.falsePositiveLikelihood)}>
                          {analysis.falsePositiveLikelihood}
                        </Badge>
                        {analysis.falsePositiveRationale && (
                          <p className="text-xs text-muted-foreground mt-1">{analysis.falsePositiveRationale}</p>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Asset Criticality */}
              {analysis.assetCriticality && (
                <Card className="border-border">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      Asset Criticality: {analysis.assetCriticality}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-foreground/90">{analysis.impactNote}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* No AI analysis available */}
          {!alert.ai_analysis && (
            <Card className="border-muted">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground text-center">
                  AI Intelligence temporarily unavailable. Alert is queued for processing.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Raw Log */}
          {alert.raw_log && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Raw Log Data</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                  {JSON.stringify(alert.raw_log, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Target, Building, Flag, Shield, Lightbulb, AlertCircle, Eye, Link, BarChart3, ShieldAlert } from "lucide-react";

interface AIIncidentSummaryProps {
  summary: string;
  isAIUsed?: boolean;
}

interface ParsedSummary {
  attackPattern: string;
  observedBehavior: string;
  businessImpact: string;
  priorityLevel: string;
  containmentSteps: string;
  recommendation: string;
  // Correlation evidence
  incidentOrigin: string;
  triggerRule: string;
  correlationDrivers: string;
  correlationSummary: string;
  matchedEntities: string;
  supportingAlerts: string;
  // Confidence & FP
  confidenceScore: string;
  confidenceInterpretation: string;
  falsePositiveLikelihood: string;
  falsePositiveRationale: string;
  isRuleBased: boolean;
}

function parseSummary(summary: string): ParsedSummary {
  const sections: ParsedSummary = {
    attackPattern: "",
    observedBehavior: "",
    businessImpact: "",
    priorityLevel: "",
    containmentSteps: "",
    recommendation: "",
    incidentOrigin: "",
    triggerRule: "",
    correlationDrivers: "",
    correlationSummary: "",
    matchedEntities: "",
    supportingAlerts: "",
    confidenceScore: "",
    confidenceInterpretation: "",
    falsePositiveLikelihood: "",
    falsePositiveRationale: "",
    isRuleBased: summary.includes("[Rule-based analysis"),
  };

  const get = (pattern: RegExp) => pattern.exec(summary)?.[1]?.trim() || "";

  sections.attackPattern = get(/ATTACK PATTERN:\s*([\s\S]*?)(?=OBSERVED BEHAVIOR:|BUSINESS IMPACT:|$)/i);
  sections.observedBehavior = get(/OBSERVED BEHAVIOR:\s*([\s\S]*?)(?=BUSINESS IMPACT:|$)/i);
  sections.businessImpact = get(/BUSINESS IMPACT:\s*([\s\S]*?)(?=PRIORITY LEVEL:|$)/i);
  sections.priorityLevel = get(/PRIORITY LEVEL:\s*([\s\S]*?)(?=CONTAINMENT STEPS:|$)/i);
  sections.containmentSteps = get(/CONTAINMENT STEPS:\s*([\s\S]*?)(?=ANALYST RECOMMENDATION:|$)/i);
  sections.recommendation = get(/ANALYST RECOMMENDATION:\s*([\s\S]*?)(?=CORRELATION EVIDENCE:|CONFIDENCE SCORE:|\[Rule-based|$)/i);

  // Correlation evidence
  sections.incidentOrigin = get(/INCIDENT ORIGIN:\s*(.+)/i);
  sections.triggerRule = get(/TRIGGER RULE:\s*(.+)/i);
  sections.correlationDrivers = get(/CORRELATION DRIVERS:\s*(.+)/i);
  sections.correlationSummary = get(/CORRELATION SUMMARY:\s*(.+)/i);
  sections.matchedEntities = get(/MATCHED ENTITIES:\s*(.+)/i);
  sections.supportingAlerts = get(/SUPPORTING ALERTS:\s*(.+)/i);

  // Confidence & FP
  sections.confidenceScore = get(/CONFIDENCE SCORE:\s*(.+)/i);
  sections.confidenceInterpretation = get(/CONFIDENCE INTERPRETATION:\s*(.+)/i);
  sections.falsePositiveLikelihood = get(/FALSE POSITIVE LIKELIHOOD:\s*(.+)/i);
  sections.falsePositiveRationale = get(/FALSE POSITIVE RATIONALE:\s*(.+)/i);

  return sections;
}

function getPriorityBadge(priority: string): { label: string; className: string } {
  if (priority.includes("P1")) return { label: "P1 - Critical", className: "bg-destructive text-destructive-foreground" };
  if (priority.includes("P2")) return { label: "P2 - High", className: "bg-orange-500 text-white" };
  if (priority.includes("P3")) return { label: "P3 - Medium", className: "bg-yellow-500 text-black" };
  if (priority.includes("P4")) return { label: "P4 - Low", className: "bg-primary text-primary-foreground" };
  return { label: "Unknown", className: "bg-muted text-muted-foreground" };
}

function getConfidenceBadge(score: string) {
  const num = parseInt(score);
  if (num >= 80) return { className: "bg-primary/20 text-primary border-primary" };
  if (num >= 50) return { className: "bg-yellow-500/20 text-yellow-700 border-yellow-500" };
  return { className: "bg-destructive/20 text-destructive border-destructive" };
}

function getFPBadge(level: string) {
  if (level.includes("Low")) return { className: "bg-primary/20 text-primary border-primary" };
  if (level.includes("Medium")) return { className: "bg-yellow-500/20 text-yellow-700 border-yellow-500" };
  return { className: "bg-destructive/20 text-destructive border-destructive" };
}

function formatTriggerRule(rule: string): string {
  const ruleNames: Record<string, string> = {
    credential_attack: "Credential Attack Detection",
    ip_correlation: "IP-Based Correlation",
    user_correlation: "User-Based Correlation",
    asset_correlation: "Asset-Based Correlation",
    phishing_detection: "Phishing Campaign Detection",
    risk_threshold: "Risk Score Threshold",
    malware_detection: "Malware Detection",
    insider_threat: "Insider Threat Detection",
    auto_correlation: "Auto-Correlation",
  };
  return ruleNames[rule] || rule;
}

export function AIIncidentSummary({ summary, isAIUsed = true }: AIIncidentSummaryProps) {
  const parsed = parseSummary(summary);
  const priorityBadge = getPriorityBadge(parsed.priorityLevel);
  const isRuleBased = parsed.isRuleBased || !isAIUsed;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground">AI Incident Intelligence</span>
          <Badge variant="secondary" className="text-xs">AI-Generated</Badge>
        </div>
        {isRuleBased && (
          <Badge variant="outline" className="text-xs flex items-center gap-1 border-warning text-warning">
            <AlertCircle className="h-3 w-3" />
            AI unavailable – fallback mode
          </Badge>
        )}
      </div>

      {/* Attack Pattern */}
      {parsed.attackPattern && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-destructive" />
              Attack Pattern
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-foreground/90">{parsed.attackPattern}</p>
          </CardContent>
        </Card>
      )}

      {/* Observed Behavior */}
      {parsed.observedBehavior && (
        <Card className="border-orange-500/30 bg-orange-500/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-orange-500" />
              Observed Behavior
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-foreground/90 whitespace-pre-wrap">{parsed.observedBehavior}</div>
          </CardContent>
        </Card>
      )}

      {/* Business Impact */}
      {parsed.businessImpact && (
        <Card className="border-warning/30 bg-warning/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Building className="h-4 w-4 text-warning" />
              Business Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-foreground/90">{parsed.businessImpact}</p>
          </CardContent>
        </Card>
      )}

      {/* Priority Level */}
      {parsed.priorityLevel && (
        <Card className="border-info/30 bg-info/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Flag className="h-4 w-4 text-info" />
              Priority Level
              <Badge className={priorityBadge.className}>{priorityBadge.label}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-foreground/90">{parsed.priorityLevel}</p>
          </CardContent>
        </Card>
      )}

      {/* Containment Steps */}
      {parsed.containmentSteps && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Containment Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-foreground/90 whitespace-pre-wrap">{parsed.containmentSteps}</div>
          </CardContent>
        </Card>
      )}

      {/* Analyst Recommendation */}
      {parsed.recommendation && (
        <Card className="border-muted bg-muted/30">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-foreground" />
              Analyst Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-foreground/90">{parsed.recommendation}</p>
          </CardContent>
        </Card>
      )}

      {/* Correlation Evidence */}
      {(parsed.triggerRule || parsed.correlationDrivers) && (
        <Card className="border-info/30 bg-info/5">
          <CardHeader className="pb-2 pt-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Link className="h-4 w-4 text-info" />
              Correlation Evidence
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2 text-sm">
            {parsed.incidentOrigin && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Incident Origin:</span>
                <Badge variant="outline" className="text-xs">{parsed.incidentOrigin}</Badge>
              </div>
            )}
            {parsed.triggerRule && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trigger Rule:</span>
                <span className="font-medium">{formatTriggerRule(parsed.triggerRule)}</span>
              </div>
            )}
            {parsed.correlationDrivers && (
              <div>
                <span className="text-muted-foreground">Correlation Drivers:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {parsed.correlationDrivers.split(',').map((d, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{d.trim()}</Badge>
                  ))}
                </div>
              </div>
            )}
            {parsed.correlationSummary && (
              <div>
                <span className="text-muted-foreground">Summary:</span>
                <p className="text-foreground/90 mt-0.5">{parsed.correlationSummary}</p>
              </div>
            )}
            {parsed.matchedEntities && (
              <div>
                <span className="text-muted-foreground">Matched Entities:</span>
                <p className="text-foreground/90 font-mono text-xs mt-0.5">{parsed.matchedEntities}</p>
              </div>
            )}
            {parsed.supportingAlerts && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supporting Alerts:</span>
                <span className="font-medium">{parsed.supportingAlerts}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Confidence & False Positive */}
      {(parsed.confidenceScore || parsed.falsePositiveLikelihood) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {parsed.confidenceScore && (
            <Card className="border-border">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-foreground" />
                  Confidence Score
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getConfidenceBadge(parsed.confidenceScore).className}>
                    {parsed.confidenceScore}
                  </Badge>
                </div>
                {parsed.confidenceInterpretation && (
                  <p className="text-xs text-muted-foreground mt-1">{parsed.confidenceInterpretation}</p>
                )}
              </CardContent>
            </Card>
          )}

          {parsed.falsePositiveLikelihood && (
            <Card className="border-border">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-foreground" />
                  False Positive Likelihood
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Badge variant="outline" className={getFPBadge(parsed.falsePositiveLikelihood).className}>
                  {parsed.falsePositiveLikelihood}
                </Badge>
                {parsed.falsePositiveRationale && (
                  <p className="text-xs text-muted-foreground mt-1">{parsed.falsePositiveRationale}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

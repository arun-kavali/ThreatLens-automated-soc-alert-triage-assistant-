import { useState } from "react";
import { Shield, Send, Loader2, CheckCircle, AlertTriangle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type AlertSeverity = "Low" | "Medium" | "High" | "Critical";

interface AlertFormData {
  source_system: string;
  alert_type: string;
  severity: AlertSeverity;
  raw_log: string;
}

const initialFormData: AlertFormData = {
  source_system: "",
  alert_type: "",
  severity: "Medium",
  raw_log: "",
};

// Named scenario presets for realistic multi-alert patterns
const SCENARIO_PRESETS = [
  {
    name: "Credential Stuffing Attempt",
    description: "Coordinated login attacks from a single source against multiple accounts",
    generate: () => {
      const sourceIp = `${Math.floor(Math.random() * 200) + 20}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      const geos = ["Eastern Europe", "Southeast Asia", "West Africa", "South America"];
      const geo = geos[Math.floor(Math.random() * geos.length)];
      return Array.from({ length: 5 }, (_, i) => ({
        source_system: "Authentication System",
        alert_type: "Credential Stuffing Attack",
        severity: (i < 3 ? "High" : "Critical") as AlertSeverity,
        raw_log: {
          source_ip: sourceIp,
          affected_user: `user${100 + i}@company.com`,
          failed_attempts: 15 + Math.floor(Math.random() * 30),
          message: "Credential stuffing pattern detected — automated login attempts using known breach data",
          geo_location: geo,
          user_agent: "python-requests/2.28.1",
        },
        status: "New" as const,
        ai_used: false,
      }));
    },
  },
  {
    name: "Phishing Campaign Simulation",
    description: "Multi-target phishing emails followed by suspicious login activity",
    generate: () => {
      const senderDomain = ["secure-verify.co", "account-update.net", "login-confirm.org"][Math.floor(Math.random() * 3)];
      const alerts: any[] = [];
      // 3 phishing emails
      for (let i = 0; i < 3; i++) {
        alerts.push({
          source_system: "Email Gateway",
          alert_type: "Phishing Email Detected",
          severity: "High" as AlertSeverity,
          raw_log: {
            source_ip: `198.51.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            affected_user: `employee${200 + i}@company.com`,
            sender: `noreply@${senderDomain}`,
            subject: ["Urgent: Verify Your Account", "Password Reset Required", "IT Security Update"][i],
            message: "Phishing email with credential harvesting link detected",
            indicators: ["Spoofed sender domain", "Urgency language", "Suspicious URL"],
          },
          status: "New" as const,
          ai_used: false,
        });
      }
      // 2 suspicious logins after phishing
      for (let i = 0; i < 2; i++) {
        alerts.push({
          source_system: "Cloud IAM",
          alert_type: "Suspicious Login",
          severity: "Critical" as AlertSeverity,
          raw_log: {
            source_ip: `${Math.floor(Math.random() * 200) + 20}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            affected_user: `employee${200 + i}@company.com`,
            location: ["Unknown VPN", "Foreign IP"][i],
            device: "Unknown Device",
            message: "Login from unusual location following phishing campaign",
          },
          status: "New" as const,
          ai_used: false,
        });
      }
      return alerts;
    },
  },
  {
    name: "Malware Beaconing Activity",
    description: "Endpoint malware with C2 beaconing and lateral movement indicators",
    generate: () => {
      const affectedSystem = `WORKSTATION-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`;
      const c2Domain = ["cdn-update.evil.com", "api.legit-service.xyz", "telemetry.cloud-sync.net"][Math.floor(Math.random() * 3)];
      const alerts: any[] = [];
      // Initial malware detection
      alerts.push({
        source_system: "EDR",
        alert_type: "Malware Detection",
        severity: "Critical" as AlertSeverity,
        raw_log: {
          source_ip: `172.16.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          affected_system: affectedSystem,
          malware_type: "Trojan",
          file_path: `C:\\Users\\user\\AppData\\Local\\Temp\\svchost_update.exe`,
          hash: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
          message: "Malicious executable detected and quarantined",
        },
        status: "New" as const,
        ai_used: false,
      });
      // C2 beaconing
      for (let i = 0; i < 3; i++) {
        alerts.push({
          source_system: "Network Monitor",
          alert_type: "Malware Beaconing",
          severity: "High" as AlertSeverity,
          raw_log: {
            source_ip: `172.16.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
            affected_system: affectedSystem,
            destination: c2Domain,
            beacon_interval: `${60 + Math.floor(Math.random() * 120)}s`,
            bytes_sent: Math.floor(Math.random() * 5000) + 100,
            message: `Periodic outbound connection to ${c2Domain} consistent with C2 beaconing`,
          },
          status: "New" as const,
          ai_used: false,
        });
      }
      // Port scanning from infected host
      alerts.push({
        source_system: "Firewall",
        alert_type: "Port Scanning Activity",
        severity: "Medium" as AlertSeverity,
        raw_log: {
          source_ip: `172.16.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          affected_system: affectedSystem,
          ports_scanned: Math.floor(Math.random() * 200) + 50,
          scan_type: "SYN",
          message: "Internal network scanning from potentially compromised host",
        },
        status: "New" as const,
        ai_used: false,
      });
      return alerts;
    },
  },
  {
    name: "Insider Threat Behavior",
    description: "Privileged user performing unusual data access and privilege escalation",
    generate: () => {
      const insiderUser = `admin${Math.floor(Math.random() * 10)}@company.com`;
      const sourceIp = `192.168.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 255)}`;
      return [
        {
          source_system: "Cloud IAM",
          alert_type: "Privilege Escalation Attempt",
          severity: "Critical" as AlertSeverity,
          raw_log: {
            source_ip: sourceIp,
            affected_user: insiderUser,
            affected_system: "PROD-DATABASE-01",
            action: "Role elevation to Super Admin",
            message: "Unauthorized privilege escalation attempt on production database",
          },
          status: "New" as const,
          ai_used: false,
        },
        {
          source_system: "DLP",
          alert_type: "Data Exfiltration",
          severity: "Critical" as AlertSeverity,
          raw_log: {
            source_ip: sourceIp,
            affected_user: insiderUser,
            affected_system: "FILE-SERVER-03",
            bytes_transferred: Math.floor(Math.random() * 500000) + 100000,
            destination: "personal-cloud-storage.com",
            message: "Large volume data transfer to external destination by privileged user",
          },
          status: "New" as const,
          ai_used: false,
        },
        {
          source_system: "SIEM",
          alert_type: "Insider Threat Activity",
          severity: "High" as AlertSeverity,
          raw_log: {
            source_ip: sourceIp,
            affected_user: insiderUser,
            affected_system: "HR-DATABASE",
            records_accessed: Math.floor(Math.random() * 5000) + 1000,
            access_time: "02:30 AM",
            message: "Bulk data access during non-business hours by privileged identity",
          },
          status: "New" as const,
          ai_used: false,
        },
        {
          source_system: "Cloud IAM",
          alert_type: "Unauthorized Access",
          severity: "High" as AlertSeverity,
          raw_log: {
            source_ip: sourceIp,
            affected_user: insiderUser,
            affected_system: "FINANCE-REPORTS",
            message: "Access to restricted financial systems outside normal authorization scope",
          },
          status: "New" as const,
          ai_used: false,
        },
      ];
    },
  },
];

const SEVERITIES: AlertSeverity[] = ["Low", "Medium", "High", "Critical"];

export default function AlertSourceDashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<AlertFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmission, setLastSubmission] = useState<{ id: string; timestamp: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>("random");

  const handleGenerateScenarioAlerts = async () => {
    setIsGenerating(true);

    try {
      let alertsToInsert: any[];

      if (selectedScenario === "random") {
        // Pick a random scenario
        const scenario = SCENARIO_PRESETS[Math.floor(Math.random() * SCENARIO_PRESETS.length)];
        alertsToInsert = scenario.generate();
        toast({
          title: `Scenario: ${scenario.name}`,
          description: `${alertsToInsert.length} coherent alerts injected for "${scenario.name}".`,
        });
      } else {
        const scenario = SCENARIO_PRESETS.find(s => s.name === selectedScenario);
        if (!scenario) throw new Error("Scenario not found");
        alertsToInsert = scenario.generate();
        toast({
          title: `Scenario: ${scenario.name}`,
          description: `${alertsToInsert.length} coherent alerts injected for "${scenario.name}".`,
        });
      }

      const { data: inserted, error } = await supabase.from("alerts").insert(alertsToInsert).select();
      if (error) throw error;

      // Trigger AI analysis for each inserted alert
      if (inserted) {
        for (const alert of inserted) {
          supabase.functions.invoke('analyze-alert', { body: { alert } }).catch(err =>
            console.error('Auto-analyze failed for', alert.id, err)
          );
        }
      }
    } catch (error: any) {
      console.error("Error generating scenario alerts:", error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: error.message || "Failed to generate scenario alerts.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.source_system.trim() || !formData.alert_type.trim()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Source system and alert type are required.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let parsedRawLog = null;
      if (formData.raw_log.trim()) {
        try {
          parsedRawLog = JSON.parse(formData.raw_log);
        } catch {
          parsedRawLog = { message: formData.raw_log };
        }
      }

      const { data, error } = await supabase
        .from("alerts")
        .insert({
          source_system: formData.source_system.trim(),
          alert_type: formData.alert_type.trim(),
          severity: formData.severity,
          raw_log: parsedRawLog,
          status: "New",
          ai_used: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger AI analysis automatically
      supabase.functions.invoke('analyze-alert', { body: { alert: data } }).catch(err =>
        console.error('Auto-analyze failed for', data.id, err)
      );

      setLastSubmission({
        id: data.id,
        timestamp: new Date(data.timestamp).toLocaleString(),
      });

      toast({
        title: "Alert Submitted",
        description: "Your alert has been submitted and will be processed automatically.",
      });

      setFormData(initialFormData);
    } catch (error: any) {
      console.error("Error submitting alert:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "Failed to submit alert.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">ThreatLens</h1>
              <p className="text-xs text-muted-foreground">Alert Source Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Submit Security Alert
            </CardTitle>
            <CardDescription>
              Submit alerts to the ThreatLens SOC for automated analysis and correlation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="source_system">Source System *</Label>
                <Input
                  id="source_system"
                  placeholder="e.g., Authentication System, Firewall, EDR"
                  value={formData.source_system}
                  onChange={(e) => setFormData({ ...formData, source_system: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="alert_type">Alert Type *</Label>
                <Input
                  id="alert_type"
                  placeholder="e.g., Brute Force Attack, Malware Detection"
                  value={formData.alert_type}
                  onChange={(e) => setFormData({ ...formData, alert_type: e.target.value })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: AlertSeverity) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="raw_log">Raw Log Data (Optional)</Label>
                <Textarea
                  id="raw_log"
                  placeholder='{"source_ip": "192.168.1.100", "message": "Alert details..."}'
                  value={formData.raw_log}
                  onChange={(e) => setFormData({ ...formData, raw_log: e.target.value })}
                  className="bg-background min-h-[120px] font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Enter JSON data or plain text. Plain text will be wrapped in a message object.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Submit Alert</>
                )}
              </Button>
            </form>

            {lastSubmission && (
              <div className="mt-6 p-4 rounded-lg border border-primary/30 bg-primary/5">
                <div className="flex items-center gap-2 text-primary font-medium mb-2">
                  <CheckCircle className="h-5 w-5" />
                  Alert Submitted Successfully
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Alert ID:</strong> {lastSubmission.id}</p>
                  <p><strong>Submitted:</strong> {lastSubmission.timestamp}</p>
                  <p className="text-xs mt-2 italic">
                    This alert will be automatically analyzed and correlated by the system.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Scenario-Based Alert Injection */}
        <Card className="mt-6 border-dashed border-2 border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-5 w-5 text-primary" />
              Scenario-Based Alert Injection
            </CardTitle>
            <CardDescription className="text-xs">
              Generate coherent multi-alert attack scenarios for demo and testing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="random">🎲 Random Scenario</SelectItem>
                {SCENARIO_PRESETS.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedScenario !== "random" && (
              <p className="text-xs text-muted-foreground">
                {SCENARIO_PRESETS.find(s => s.name === selectedScenario)?.description}
              </p>
            )}

            <Button
              onClick={handleGenerateScenarioAlerts}
              disabled={isGenerating}
              variant="outline"
              className="w-full border-primary/50 hover:bg-primary/10"
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating Scenario...</>
              ) : (
                <><Zap className="h-4 w-4 mr-2" />Inject Scenario Alerts</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Alerts will be automatically analyzed and correlated into incidents.
            </p>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-muted/30 border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">About Alert Processing</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Submitted alerts are automatically analyzed by AI</li>
                  <li>Risk scores and severity are calculated deterministically</li>
                  <li>Related alerts are correlated into incidents by rule engine</li>
                  <li>SOC Analysts are notified of critical alerts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

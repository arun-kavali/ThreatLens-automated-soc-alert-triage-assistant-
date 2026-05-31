import { useState, useEffect } from "react";
import { Database, Plus, Trash2, Loader2, CheckCircle, XCircle, ToggleLeft, ToggleRight, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DbConnection {
  id: string;
  name: string;
  status: string;
  is_active: boolean;
  last_tested_at: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  alerts_table_name: string;
  sync_interval_minutes: number;
  created_at: string;
}

export default function AdminPanel() {
  const { toast } = useToast();
  const [connections, setConnections] = useState<DbConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formTable, setFormTable] = useState("alerts");
  const [formInterval, setFormInterval] = useState(5);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchConnections = async () => {
    try {
      const { data, error } = await supabase
        .from("db_connections")
        .select("id, name, status, is_active, last_tested_at, last_sync_at, last_error, alerts_table_name, sync_interval_minutes, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setConnections(data || []);
    } catch (err: any) {
      console.error("Error fetching connections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleTestConnection = async () => {
    if (!formUrl.trim()) {
      toast({ variant: "destructive", title: "URL Required", description: "Please enter a database connection URL." });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("db-connect", {
        body: { action: "test", connection_url: formUrl },
      });
      if (error) throw error;
      setTestResult({ success: data.success, message: data.message || data.error || "Unknown result" });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Test failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveConnection = async () => {
    if (!formUrl.trim() || !formName.trim()) {
      toast({ variant: "destructive", title: "Required Fields", description: "Name and connection URL are required." });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("db-connect", {
        body: {
          action: "save",
          connection_url: formUrl,
          name: formName,
          alerts_table_name: formTable,
          sync_interval_minutes: formInterval,
        },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({ title: "Connection Saved", description: `"${formName}" has been added.` });
      setShowAddForm(false);
      setFormName("");
      setFormUrl("");
      setFormTable("alerts");
      setFormInterval(5);
      setTestResult(null);
      fetchConnections();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Save Failed", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConnection = async (id: string, name: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("db-connect", {
        body: { action: "delete", connection_id: id },
      });
      if (error) throw error;
      toast({ title: "Connection Removed", description: `"${name}" has been deleted.` });
      fetchConnections();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  };

  const handleToggleConnection = async (id: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("db-connect", {
        body: { action: "toggle", connection_id: id },
      });
      if (error) throw error;
      fetchConnections();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Toggle Failed", description: err.message });
    }
  };

  const handleSyncNow = async (id: string) => {
    setSyncing(id);
    try {
      const { data, error } = await supabase.functions.invoke("ingest-external-alerts", {
        body: { connection_id: id },
      });
      if (error) throw error;
      toast({
        title: "Sync Complete",
        description: `Ingested ${data.total_ingested || 0} new alerts.`,
      });
      fetchConnections();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: err.message });
    } finally {
      setSyncing(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Connected</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "disabled":
        return <Badge variant="secondary">Disabled</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            Database Connections
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connect external PostgreSQL databases to ingest alerts automatically.
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "secondary" : "default"}>
          <Plus className="h-4 w-4 mr-2" />
          {showAddForm ? "Cancel" : "Add Connection"}
        </Button>
      </div>

      {/* Add Connection Form */}
      {showAddForm && (
        <Card className="border-primary/30 bg-card">
          <CardHeader>
            <CardTitle className="text-base">New Database Connection</CardTitle>
            <CardDescription>Provide a PostgreSQL connection URL to ingest alerts from an external database.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Connection Name *</Label>
              <Input
                placeholder="e.g., Production SIEM Database"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label>Connection URL *</Label>
              <Input
                type="password"
                placeholder="postgres://user:password@host:5432/database"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="bg-background font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                URL is stored securely. Format: postgres://user:password@host:port/database
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Alerts Table Name</Label>
                <Input
                  placeholder="alerts"
                  value={formTable}
                  onChange={(e) => setFormTable(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label>Sync Interval (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={formInterval}
                  onChange={(e) => setFormInterval(Number(e.target.value))}
                  className="bg-background"
                />
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-md border ${testResult.success ? "border-emerald-500/30 bg-emerald-500/10" : "border-destructive/30 bg-destructive/10"}`}>
                <div className="flex items-center gap-2 text-sm">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className={testResult.success ? "text-emerald-400" : "text-destructive"}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleTestConnection} disabled={testing || !formUrl.trim()}>
                {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TestTube className="h-4 w-4 mr-2" />}
                Test Connection
              </Button>
              <Button onClick={handleSaveConnection} disabled={saving || !formUrl.trim() || !formName.trim()}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Save Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connections List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : connections.length === 0 ? (
        <Card className="bg-muted/30 border-border">
          <CardContent className="pt-6 text-center">
            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No database connections configured.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Add Connection" to connect an external PostgreSQL database.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {connections.map((conn) => (
            <Card key={conn.id} className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-foreground truncate">{conn.name}</h3>
                      {statusBadge(conn.status)}
                      {conn.is_active ? (
                        <Badge variant="outline" className="text-emerald-400 border-emerald-500/30">Active</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Table: {conn.alerts_table_name}</span>
                      <span>Interval: {conn.sync_interval_minutes}m</span>
                      {conn.last_sync_at && (
                        <span>Last sync: {new Date(conn.last_sync_at).toLocaleString()}</span>
                      )}
                    </div>
                    {conn.last_error && (
                      <p className="text-xs text-destructive mt-1 truncate">{conn.last_error}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSyncNow(conn.id)}
                      disabled={!conn.is_active || conn.status !== "connected" || syncing === conn.id}
                      title="Sync Now"
                    >
                      {syncing === conn.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Database className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleConnection(conn.id)}
                      title={conn.is_active ? "Disable" : "Enable"}
                    >
                      {conn.is_active ? (
                        <ToggleRight className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteConnection(conn.id, conn.name)}
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

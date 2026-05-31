import { Shield, AlertTriangle, FileWarning, CheckCircle } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useRealtimeIncidents } from "@/hooks/useRealtimeIncidents";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SeverityChart } from "@/components/dashboard/SeverityChart";
import { AlertsTimelineChart } from "@/components/dashboard/AlertsTimelineChart";
import { IncidentStatusChart } from "@/components/dashboard/IncidentStatusChart";
import { SourceChart } from "@/components/dashboard/SourceChart";
import { RecentAlertsTable } from "@/components/dashboard/RecentAlertsTable";
import { ActiveIncidentsTable } from "@/components/dashboard/ActiveIncidentsTable";

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  
  // Subscribe to real-time incident updates
  useRealtimeIncidents();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SOC Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time overview of your security posture
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Alerts"
          value={stats?.totalAlerts ?? 0}
          icon={AlertTriangle}
          color="text-warning"
          bgColor="bg-warning/10"
          isLoading={isLoading}
        />
        <StatsCard
          title="Critical Alerts"
          value={stats?.criticalAlerts ?? 0}
          icon={Shield}
          color="text-destructive"
          bgColor="bg-destructive/10"
          isLoading={isLoading}
        />
        <StatsCard
          title="Open Incidents"
          value={stats?.openIncidents ?? 0}
          icon={FileWarning}
          color="text-info"
          bgColor="bg-info/10"
          isLoading={isLoading}
        />
        <StatsCard
          title="Resolved Today"
          value={stats?.resolvedToday ?? 0}
          icon={CheckCircle}
          color="text-primary"
          bgColor="bg-primary/10"
          isLoading={isLoading}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AlertsTimelineChart />
        <SeverityChart />
        <IncidentStatusChart />
        <SourceChart />
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAlertsTable />
        <ActiveIncidentsTable />
      </div>
    </div>
  );
}

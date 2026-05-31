import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlertsOverTime } from "@/hooks/useAlerts";

export function AlertsTimelineChart() {
  const { data, isLoading } = useAlertsOverTime();

  const totalAlerts = data?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Alerts Over Time (7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-full w-full bg-muted animate-pulse rounded" />
          </div>
        ) : totalAlerts === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>No alert data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="hsl(160, 84%, 39%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#alertGradient)"
                name="Alerts"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

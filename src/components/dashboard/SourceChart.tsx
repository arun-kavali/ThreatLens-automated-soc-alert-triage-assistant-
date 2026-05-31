import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlertsBySource } from "@/hooks/useAlerts";

export function SourceChart() {
  const { data, isLoading } = useAlertsBySource();

  const totalAlerts = data?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Alerts by Source System</CardTitle>
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
            <BarChart data={data} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                type="number"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="source"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Bar
                dataKey="count"
                fill="hsl(160, 84%, 39%)"
                radius={[0, 4, 4, 0]}
                name="Alerts"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

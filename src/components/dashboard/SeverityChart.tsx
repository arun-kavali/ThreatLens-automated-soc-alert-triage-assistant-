import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAlertsBySeverity } from "@/hooks/useAlerts";

const SEVERITY_COLORS: Record<string, string> = {
  Critical: "hsl(0, 84%, 60%)",
  High: "hsl(24, 95%, 53%)",
  Medium: "hsl(48, 96%, 53%)",
  Low: "hsl(160, 84%, 39%)",
};

export function SeverityChart() {
  const { data, isLoading } = useAlertsBySeverity();

  const totalAlerts = data?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Alert Severity Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-32 w-32 rounded-full bg-muted animate-pulse" />
          </div>
        ) : totalAlerts === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>No alerts to display</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="count"
                nameKey="severity"
              >
                {data?.map((entry) => (
                  <Cell
                    key={entry.severity}
                    fill={SEVERITY_COLORS[entry.severity]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, name]}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend
                formatter={(value) => (
                  <span className="text-muted-foreground text-sm">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

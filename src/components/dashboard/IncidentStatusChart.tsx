import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIncidentsByStatus } from "@/hooks/useIncidents";

const STATUS_COLORS: Record<string, string> = {
  Open: "hsl(0, 84%, 60%)",
  "In Progress": "hsl(48, 96%, 53%)",
  Resolved: "hsl(160, 84%, 39%)",
  Closed: "hsl(215, 20%, 65%)",
};

export function IncidentStatusChart() {
  const { data, isLoading } = useIncidentsByStatus();

  const totalIncidents = data?.reduce((sum, item) => sum + item.count, 0) ?? 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg">Incident Status</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="h-full w-full bg-muted animate-pulse rounded" />
          </div>
        ) : totalIncidents === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            <p>No incidents to display</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="status"
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
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Incidents">
                {data?.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_COLORS[entry.status]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

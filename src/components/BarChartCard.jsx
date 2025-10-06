import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const data = [
  { name: "1", value: 8 },
  { name: "2", value: 12 },
  { name: "3", value: 6 },
  { name: "4", value: 14 },
  { name: "5", value: 10 },
  { name: "6", value: 16 },
  { name: "7", value: 12 },
  { name: "8", value: 18 },
  { name: "9", value: 11 },
  { name: "10", value: 20 },
  { name: "11", value: 13 },
  { name: "12", value: 22 },
];

export default function BarChartCard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <div className="rounded-2xl border border-border/50 bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-foreground/60">
            Sessions
          </p>
          <div className="text-lg font-semibold">This month</div>
        </div>
      </div>
      <div className="h-48">
        {mounted && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="name"
                stroke="hsla(var(--foreground),0.5)"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar
                dataKey="value"
                radius={[6, 6, 0, 0]}
                fill="hsl(var(--primary))"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

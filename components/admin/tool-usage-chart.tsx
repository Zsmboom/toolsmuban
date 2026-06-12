"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface ToolUsageData {
  toolName: string;
  count: number;
  avgDuration: number;
}

interface ToolUsageChartProps {
  data: ToolUsageData[];
}

export function ToolUsageChart({ data }: ToolUsageChartProps) {
  const chartData = data.slice(0, 10).map((item) => ({
    name: item.toolName,
    count: item.count,
    avgDuration: Math.round(item.avgDuration),
  }));

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">
        Top 10 Tools by Usage Count
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" name="Usage Count" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

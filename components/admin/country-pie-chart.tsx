"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";

interface CountryData {
  country: string;
  userCount: number;
  toolUsageCount: number;
}

interface CountryPieChartProps {
  data: CountryData[];
  dataKey: "userCount" | "toolUsageCount";
  title: string;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B9D",
  "#C084FC",
  "#FB923C",
];

export function CountryPieChart({ data, dataKey, title }: CountryPieChartProps) {
  // Take top 10 countries
  const topCountries = data.slice(0, 10);

  const chartData = topCountries.map((item) => ({
    name: item.country,
    value: item[dataKey],
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name} (${((percent || 0) * 100).toFixed(0)}%)`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number | undefined) => [
              `${value || 0} (${(((value || 0) / total) * 100).toFixed(1)}%)`,
              "",
            ]}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

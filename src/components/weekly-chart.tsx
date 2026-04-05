"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type DayData = {
  date: string;
  label: string;
  volume: number;
  protein: number;
};

export function WeeklyChart({ data }: { data: DayData[] }) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-xl bg-[#1a1a1a] border border-[#262626] p-4">
      <h2 className="text-sm font-semibold text-[#a3a3a3] mb-3">
        週間トレンド
      </h2>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={2}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#737373" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="volume"
              orientation="left"
              tick={{ fontSize: 10, fill: "#737373" }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <YAxis
              yAxisId="protein"
              orientation="right"
              tick={{ fontSize: 10, fill: "#737373" }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#262626",
                border: "1px solid #333",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              itemStyle={{ color: "#f5f5f5" }}
              labelStyle={{ color: "#a3a3a3" }}
              formatter={(value: number, name: string) => {
                if (name === "ボリューム") return [`${value.toLocaleString()}kg`, name];
                return [`${value}g`, name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "10px" }}
              iconSize={8}
            />
            <Bar
              yAxisId="volume"
              dataKey="volume"
              name="ボリューム"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              yAxisId="protein"
              dataKey="protein"
              name="タンパク質"
              fill="#22c55e"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

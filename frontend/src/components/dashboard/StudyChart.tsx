import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import type { StudyLog } from "@/types";

interface StudyChartProps {
  logs?: StudyLog[];
  className?: string;
}

export const StudyChart = ({ logs = [], className = "" }: StudyChartProps) => {
  // Generate 7 days labels ending today
  const chartData = useMemo(() => {
    const days: { day: string; date: string; minutes: number; practices: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayNames = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
      const dayName = i === 0 ? "Hôm nay" : dayNames[d.getDay()];

      const matchLog = logs.find((l) => l.date === dateStr);

      days.push({
        day: dayName,
        date: dateStr,
        minutes: matchLog ? matchLog.minutesSpent : 0,
        practices: matchLog ? matchLog.practiceCount : 0,
      });
    }
    return days;
  }, [logs]);

  const totalMinutes = chartData.reduce((acc, curr) => acc + curr.minutes, 0);
  const totalPractices = chartData.reduce((acc, curr) => acc + curr.practices, 0);

  return (
    <div
      className={`bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-base font-bold text-slate-900">Tiến độ 7 ngày qua</h4>
          <p className="text-xs text-slate-500">Thời gian và số lượt phản xạ hội thoại</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
            <span className="font-semibold text-slate-700">{totalMinutes} phút</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-blue-500 inline-block" />
            <span className="font-semibold text-slate-700">{totalPractices} lượt nói</span>
          </div>
        </div>
      </div>

      <div className="w-full h-56 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#64748B" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#94A3B8" }}
              allowDecimals={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs rounded-xl py-2 px-3 shadow-lg space-y-1">
                      <p className="font-bold border-b border-slate-700 pb-1">
                        {data.day} ({data.date})
                      </p>
                      <p className="text-emerald-400">Thời gian: {data.minutes} phút</p>
                      <p className="text-blue-400">Luyện nói: {data.practices} lượt</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="minutes" radius={[6, 6, 0, 0]} maxBarSize={36}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.day === "Hôm nay" ? "#10B981" : "#A7F3D0"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StudyChart;

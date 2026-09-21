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
      className={`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-4 transition-colors ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
            Tiến độ học tập 7 ngày qua
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thời lượng và số lượt đối đáp phản xạ với AI
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
            <span className="text-slate-700 dark:text-slate-300">{totalMinutes} phút</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-md bg-indigo-500 inline-block" />
            <span className="text-slate-700 dark:text-slate-300">{totalPractices} lượt nói</span>
          </div>
        </div>
      </div>

      <div className="w-full h-56 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-100 dark:text-slate-800" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#94A3B8" }}
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
                    <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs rounded-xl py-2 px-3 shadow-xl border border-slate-700/60 space-y-1 backdrop-blur-md">
                      <p className="font-extrabold border-b border-slate-700 pb-1">
                        {data.day} ({data.date})
                      </p>
                      <p className="text-emerald-400 font-semibold">Thời gian: {data.minutes} phút</p>
                      <p className="text-indigo-400 font-semibold">Luyện nói: {data.practices} lượt</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="minutes" radius={[8, 8, 0, 0]} maxBarSize={36}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.day === "Hôm nay" ? "#10B981" : "#34D399"}
                  opacity={entry.day === "Hôm nay" ? 1 : 0.6}
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

"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type View = "services" | "breakdown";

interface DailyData {
  name: string;
  dateKey: string;
  mainTotal: number;
  kidsTotal: number;
  grandTotal: number;
  adults: number;
  kids: number;
  babies: number;
}

interface TrendsChartProps {
  chartDataServices: DailyData[];
  chartDataBreakdown: DailyData[];
}

const CustomTooltipContent = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-xl text-xs">
      <p className="font-bold text-gray-700 mb-2">{label}</p>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-bold text-gray-800">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function TrendsChart({ chartDataServices, chartDataBreakdown }: TrendsChartProps) {
  const [view, setView] = useState<View>("services");

  const isEmpty =
    view === "services"
      ? chartDataServices.length === 0
      : chartDataBreakdown.length === 0;

  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Attendance Trends</h3>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5">Last 8 services</p>
        </div>

        {/* Toggle pill */}
        <div className="flex bg-gray-100 rounded-xl p-0.5 text-xs font-semibold">
          <button
            onClick={() => setView("services")}
            className={`px-3 py-1.5 rounded-[10px] transition-all ${
              view === "services"
                ? "bg-white text-[#0072BC] shadow-sm"
                : "text-gray-400"
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setView("breakdown")}
            className={`px-3 py-1.5 rounded-[10px] transition-all ${
              view === "breakdown"
                ? "bg-white text-[#0072BC] shadow-sm"
                : "text-gray-400"
            }`}
          >
            Breakdown
          </button>
        </div>
      </div>

      {/* Chart area */}
      <div className="h-[200px] w-full">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-400 font-medium">
            No data available yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={view === "services" ? chartDataServices : chartDataBreakdown}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "#9ca3af" }}
                domain={[0, "auto"]}
              />
              <Tooltip content={<CustomTooltipContent />} />

              {view === "services" ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="mainTotal"
                    name="Main Service"
                    stroke="#0072BC"
                    strokeWidth={2.5}
                    dot={{ fill: "#0072BC", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="kidsTotal"
                    name="Kids Service"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ fill: "#10B981", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </>
              ) : (
                <>
                  <Line
                    type="monotone"
                    dataKey="adults"
                    name="Adults"
                    stroke="#0072BC"
                    strokeWidth={2.5}
                    dot={{ fill: "#0072BC", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="kids"
                    name="Kids"
                    stroke="#10B981"
                    strokeWidth={2.5}
                    dot={{ fill: "#10B981", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="babies"
                    name="Babies"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{ fill: "#F59E0B", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </>
              )}

              <Legend
                iconType="circle"
                iconSize={7}
                wrapperStyle={{ fontSize: "10px", paddingTop: "12px" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

"use client";

import { TrendingUp, TrendingDown, Minus, Users } from "lucide-react";

interface HeroCardProps {
  latestTotal: number;
  lastWeekTotal: number;
  weekOverWeekPercent: number | null;
  trendDirection: "up" | "down" | "neutral";
}

export default function HeroCard({
  latestTotal,
  lastWeekTotal,
  weekOverWeekPercent,
  trendDirection,
}: HeroCardProps) {
  const hasComparison = weekOverWeekPercent !== null;

  const trendConfig = {
    up: {
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      pill: "bg-emerald-400/20 text-emerald-300",
      prefix: "+",
    },
    down: {
      icon: <TrendingDown className="w-3.5 h-3.5" />,
      pill: "bg-rose-400/20 text-rose-300",
      prefix: "",
    },
    neutral: {
      icon: <Minus className="w-3.5 h-3.5" />,
      pill: "bg-white/10 text-white/60",
      prefix: "",
    },
  };

  const trend = trendConfig[trendDirection];

  return (
    <div className="bg-gradient-to-br from-[#0072BC] to-[#0092EA] rounded-[2rem] shadow-xl shadow-blue-200/50 p-5 sm:p-6 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -bottom-6 -right-6 opacity-10">
        <Users size={120} strokeWidth={1.5} />
      </div>

      <p className="text-white/60 text-[10px] font-semibold tracking-widest uppercase mb-3">
        Total Attendance
      </p>

      <div className="flex items-end gap-3 mb-4">
        <span className="text-6xl sm:text-7xl font-bold leading-none tracking-tighter">
          {latestTotal}
        </span>

        {hasComparison && weekOverWeekPercent !== null && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold mb-1 ${trend.pill}`}>
            {trend.icon}
            <span>
              {trend.prefix}
              {Math.abs(weekOverWeekPercent).toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {hasComparison ? (
        <p className="text-white/50 text-xs font-medium">
          vs.{" "}
          <span className="text-white/80 font-bold">{lastWeekTotal}</span>{" "}
          last week
        </p>
      ) : (
        <p className="text-white/50 text-xs font-medium italic">
          {latestTotal > 0 ? "First week — no comparison yet" : "No data yet"}
        </p>
      )}
    </div>
  );
}

"use client";

import React from "react";
import { ServiceCounts } from "@/hooks/useCounterState";
import { Minus, Plus } from "lucide-react";

interface CounterInputBarProps {
  onIncrement: (category: keyof ServiceCounts) => void;
  onDecrement: (category: keyof ServiceCounts) => void;
}

export default function CounterInputBar({ onIncrement, onDecrement }: CounterInputBarProps) {
  const categories: (keyof ServiceCounts)[] = ["kids", "babies", "adults"];

  return (
    <div className="space-y-4 pt-4 mt-auto">
      {/* Decrement Row */}
      <div className="grid grid-cols-3 gap-3 px-2">
        {categories.map((cat) => (
          <button
            key={`dec-${cat}`}
            onClick={() => onDecrement(cat)}
            className="h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 active:bg-gray-100 active:scale-95 transition-all"
            aria-label={`Decrement ${cat}`}
          >
            <Minus size={20} strokeWidth={3} />
          </button>
        ))}
      </div>

      {/* Increment Row */}
      <div className="grid grid-cols-3 gap-3 px-2">
        {categories.map((cat) => (
          <button
            key={`inc-${cat}`}
            onClick={() => onIncrement(cat)}
            className="flex flex-col items-center justify-center gap-1 bg-[#0072BC] text-white rounded-[2rem] h-28 shadow-lg shadow-blue-100/50 active:scale-95 active:bg-[#005FA0] transition-all"
            aria-label={`Increment ${cat}`}
          >
            <Plus size={28} strokeWidth={3} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] mt-1">{cat === "kids" ? "Kid" : cat === "babies" ? "Baby" : "Adult"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

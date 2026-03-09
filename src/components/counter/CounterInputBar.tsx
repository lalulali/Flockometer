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

  const handleIncrement = (cat: keyof ServiceCounts) => {
    if ("vibrate" in navigator) navigator.vibrate(80);
    onIncrement(cat);
  };

  const handleDecrement = (cat: keyof ServiceCounts) => {
    if ("vibrate" in navigator) navigator.vibrate(40);
    onDecrement(cat);
  };

  return (
    <div className="space-y-4 px-5 pb-5">
      {/* Increment Row - Main large buttons */}
      <div className="grid grid-cols-3 gap-4">
        {categories.map((cat) => (
          <button
            key={`inc-${cat}`}
            onClick={() => handleIncrement(cat)}
            className="flex flex-col items-center justify-center gap-1 bg-[#0072BC] text-white rounded-[2rem] h-32 shadow-xl shadow-blue-100/30 active:scale-[0.96] active:bg-[#006BB3] transition-all"
            aria-label={`Increment ${cat}`}
          >
            <Plus size={32} strokeWidth={3} />
            <span className="text-xs font-bold mt-1">
              {cat === "kids" ? "Kid" : cat === "babies" ? "Baby" : "Adult"}
            </span>
          </button>
        ))}
      </div>

      {/* Decrement Row - Smaller buttons below */}
      <div className="grid grid-cols-3 gap-4">
        {categories.map((cat) => (
          <button
            key={`dec-${cat}`}
            onClick={() => handleDecrement(cat)}
            className="h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 active:bg-gray-100 active:scale-[0.96] transition-all"
            aria-label={`Decrement ${cat}`}
          >
            <Minus size={22} strokeWidth={3} />
          </button>
        ))}
      </div>
    </div>
  );
}

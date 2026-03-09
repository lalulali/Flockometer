"use client";

import React from "react";
import { Undo2, RotateCcw } from "lucide-react";

interface CounterActionsProps {
  onUndo: () => void;
  onReset: () => void;
  canUndo: boolean;
}

export default function CounterActions({ onUndo, onReset, canUndo }: CounterActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`h-12 border-2 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition-all ${
          canUndo
            ? "border-[#0072BC]/20 text-[#0072BC] bg-blue-50/20 active:scale-95"
            : "border-gray-50 text-gray-300 cursor-not-allowed"
        }`}
      >
        <Undo2 className="w-4 h-4" />
        Undo
      </button>
      <button
        onClick={onReset}
        className="h-12 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm text-gray-500 active:bg-gray-50 transition-all active:scale-95"
      >
        <RotateCcw className="w-4 h-4" />
        Reset
      </button>
    </div>
  );
}

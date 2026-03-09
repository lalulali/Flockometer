"use client";

import React from "react";
import { ServiceType } from "@/hooks/useCounterState";

interface ServiceToggleProps {
  activeTab: ServiceType;
  onSwitch: (tab: ServiceType) => void;
}

export default function ServiceToggle({ activeTab, onSwitch }: ServiceToggleProps) {
  return (
    <div className="w-full bg-[#F3F4F6] p-1 rounded-2xl flex items-center mb-6">
      <button
        onClick={() => onSwitch("main")}
        className={`flex-1 py-3 text-sm font-bold tracking-wide rounded-[calc(1rem-4px)] transition-all uppercase ${
          activeTab === "main"
            ? "bg-white text-[#0072BC] shadow-sm"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        Main Service
      </button>
      <button
        onClick={() => onSwitch("kids")}
        className={`flex-1 py-3 text-sm font-bold tracking-wide rounded-[calc(1rem-4px)] transition-all uppercase ${
          activeTab === "kids"
            ? "bg-white text-[#0072BC] shadow-sm"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        Kids Service
      </button>
    </div>
  );
}

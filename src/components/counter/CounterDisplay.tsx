"use client";

import React from "react";
import { ServiceCounts } from "@/hooks/useCounterState";

interface CounterDisplayProps {
  counts: ServiceCounts;
  onSubmit: () => void;
  variant: "sticky-bar" | "hero-card";
}

export default function CounterDisplay({ counts, onSubmit, variant }: CounterDisplayProps) {
  const total = counts.adults + counts.kids + counts.babies;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-[#0072BC] to-[#0095E8] rounded-2xl p-8 flex flex-col items-center shadow-lg shadow-blue-100 mb-2">
        <span className="text-white/80 text-xs font-bold uppercase tracking-widest mb-2">
          Total Attendance
        </span>
        <div className="flex items-center justify-center h-24 mb-2">
          <span className="text-white text-[5rem] font-black leading-none animate-in zoom-in-95 duration-200">
            {total}
          </span>
        </div>
        
        {variant === "hero-card" && (
          <button 
            onClick={onSubmit}
            className="w-full mt-4 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition-all active:scale-95"
          >
            SUBMIT TO AIRTABLE
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 px-2">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center">
           <span className="text-lg font-bold text-[#1F2937] h-8 flex items-center">{counts.kids}</span>
           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Kids</span>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center">
           <span className="text-lg font-bold text-[#1F2937] h-8 flex items-center">{counts.babies}</span>
           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Babies</span>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center">
           <span className="text-lg font-bold text-[#1F2937] h-8 flex items-center">{counts.adults}</span>
           <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Adults</span>
        </div>
      </div>
    </div>
  );
}

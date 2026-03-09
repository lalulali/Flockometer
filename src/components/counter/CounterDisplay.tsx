"use client";

import { useState, useRef, useEffect } from "react";
import { ServiceCounts } from "@/hooks/useCounterState";

interface CounterDisplayProps {
  counts: ServiceCounts;
  grandTotal: number;
  onSetCount?: (category: keyof ServiceCounts, value: number) => void;
}

function EditableCount({
  label,
  value,
  onSetCount,
  category,
}: {
  label: string;
  value: number;
  category: keyof ServiceCounts;
  onSetCount?: (category: keyof ServiceCounts, value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setInputVal(String(value));
      setTimeout(() => inputRef.current?.select(), 50);
    }
  }, [editing, value]);

  const commit = () => {
    const parsed = parseInt(inputVal, 10);
    if (!isNaN(parsed) && parsed >= 0 && onSetCount) {
      onSetCount(category, parsed);
    }
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") setEditing(false);
  };

  return (
    <div
      className="flex flex-col items-center py-2 cursor-pointer select-none active:bg-white/10 transition-all"
      onClick={() => !editing && setEditing(true)}
    >
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          min={0}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-14 text-center text-white text-xl font-bold bg-white/20 rounded-xl outline-none border border-white/40 py-0.5 px-1"
          style={{ WebkitAppearance: "none", MozAppearance: "textfield" }}
        />
      ) : (
        <span className="text-white text-xl font-bold">{value}</span>
      )}
      <span className="text-white/40 text-[9px] font-medium tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

export default function CounterDisplay({ counts, grandTotal, onSetCount }: CounterDisplayProps) {
  const total = counts.adults + counts.kids + counts.babies;

  return (
    <div className="w-full bg-gradient-to-br from-[#0072BC] to-[#0092EA] rounded-[2rem] shadow-xl shadow-blue-100/50 flex flex-col overflow-hidden border border-white/10">
      {/* Top Section: Totals */}
      <div className="flex divide-x divide-white/10">
        <div className="flex-1 px-5 py-3 flex flex-col justify-center">
          <span className="text-white/60 text-[10px] font-semibold tracking-wide mb-1">
            Service Flock
          </span>
          <span className="text-white text-6xl font-bold leading-none tracking-tighter">
            {total}
          </span>
        </div>
        <div className="flex-1 px-5 py-3 flex flex-col justify-center bg-white/5">
          <span className="text-white/60 text-[10px] font-semibold tracking-wide mb-1">
            Global Flock
          </span>
          <span className="text-white text-6xl font-bold leading-none tracking-tighter">
            {grandTotal}
          </span>
        </div>
      </div>

      {/* Edge-to-edge Divider */}
      <div className="h-[1px] w-full bg-white/10" />

      {/* Bottom Section: Categories — tap to edit */}
      <div className="grid grid-cols-3 w-full divide-x divide-white/10 bg-black/5">
        <EditableCount label="Kids" value={counts.kids} category="kids" onSetCount={onSetCount} />
        <EditableCount label="Babies" value={counts.babies} category="babies" onSetCount={onSetCount} />
        <EditableCount label="Adults" value={counts.adults} category="adults" onSetCount={onSetCount} />
      </div>
    </div>
  );
}

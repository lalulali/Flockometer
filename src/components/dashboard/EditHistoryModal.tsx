"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Minus, Plus } from "lucide-react";

interface EditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (counts: { adults: number; kids: number; babies: number }) => Promise<void>;
  initialCounts: { adults: number; kids: number; babies: number };
  date: string;
  serviceType: string;
}

export default function EditHistoryModal({
  isOpen,
  onClose,
  onSave,
  initialCounts,
  date,
  serviceType,
}: EditHistoryModalProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCounts(initialCounts);
    }
  }, [isOpen, initialCounts]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(counts);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const updateCount = (key: keyof typeof counts, delta: number) => {
    setCounts((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  const handleInputChange = (key: keyof typeof counts, value: string) => {
    const num = parseInt(value, 10);
    setCounts((prev) => ({
      ...prev,
      [key]: isNaN(num) ? 0 : num,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300 ring-1 ring-black/5">
        {/* Handle for mobile */}
        <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto -mt-4 mb-8 sm:hidden" />
        
        <header className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight">Edit Record</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
              {date} • {serviceType}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 text-gray-400 rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="space-y-6 mb-10">
          {(['adults', 'kids', 'babies'] as const).map((key) => (
            <div key={key} className="flex items-center justify-between bg-gray-50/50 p-4 rounded-3xl border border-gray-100/50">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-2">{key}</span>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => updateCount(key, -1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 active:scale-90 active:bg-gray-50 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  value={counts[key]}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-16 text-center text-xl font-black text-[#0072BC] bg-transparent outline-none focus:ring-0"
                />
                <button
                  onClick={() => updateCount(key, 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-gray-100 rounded-xl text-gray-400 active:scale-90 active:bg-gray-50 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 bg-[#0072BC] text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-100 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}

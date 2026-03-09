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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-[1px] animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer Content */}
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-400 ease-out-expo ring-1 ring-black/5 flex flex-col max-h-[80vh]">
        {/* Visual Handle */}
        <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-4 flex-shrink-0" />
        
        <div className="overflow-y-auto no-scrollbar">
          <header className="flex items-center justify-between mb-4 px-1">
            <div>
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">Edit Values</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">Record</span>
                <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wide bg-blue-50 px-1.5 py-0.5 rounded-md">
                  {date} • {serviceType}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full active:scale-90 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="space-y-2 mb-6 px-0.5">
            {(['adults', 'kids', 'babies'] as const).map((key) => (
              <div key={key} className="flex items-center justify-between bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100/50 transition-all hover:border-blue-100">
                <div className="flex flex-col ml-0.5">
                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-0.5">{key}</span>
                  <span className="text-xs font-bold text-gray-500 capitalize">{key === 'babies' ? 'Infants' : key}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateCount(key, -1)}
                    className="w-9 h-9 flex items-center justify-center bg-white shadow-sm border border-gray-100 rounded-xl text-gray-400 active:scale-75 active:bg-blue-50 active:text-blue-500 transition-all"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <input
                    type="number"
                    inputMode="numeric"
                    value={counts[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="w-10 text-center text-xl font-bold text-[#0072BC] bg-transparent outline-none focus:ring-0"
                  />
                  
                  <button
                    onClick={() => updateCount(key, 1)}
                    className="w-9 h-9 flex items-center justify-center bg-white shadow-sm border border-gray-100 rounded-xl text-gray-400 active:scale-75 active:bg-blue-50 active:text-blue-500 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-0.5 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full h-12 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-100
              ${isSaving ? 'bg-gray-100 text-blue-400' : 'bg-[#0072BC] text-white active:scale-[0.98]'}
            `}
          >
            {isSaving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

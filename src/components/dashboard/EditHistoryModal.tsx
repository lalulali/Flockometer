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
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-[2px] animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer Content */}
      <div className="relative w-full max-w-lg bg-white rounded-t-[3rem] sm:rounded-[3rem] p-6 pb-10 sm:p-8 shadow-2xl animate-in slide-in-from-bottom duration-500 ease-out-expo ring-1 ring-black/5 flex flex-col max-h-[90vh]">
        {/* Visual Handle */}
        <div className="w-16 h-1.5 bg-gray-100 rounded-full mx-auto mt-0 mb-8 flex-shrink-0" />
        
        <div className="overflow-y-auto no-scrollbar">
          <header className="flex items-center justify-between mb-8 px-2">
            <div>
              <h2 className="text-2xl font-black text-gray-800 tracking-tight">Edit Values</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-none">Record</span>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide bg-blue-50 px-2 py-0.5 rounded-md">
                  {date} • {serviceType}
                </span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full active:scale-90 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </header>

          <div className="space-y-4 mb-10 px-1">
            {(['adults', 'kids', 'babies'] as const).map((key) => (
              <div key={key} className="flex items-center justify-between bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100/50 group transition-all hover:border-blue-100">
                <div className="flex flex-col ml-1">
                  <span className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-0.5">{key}</span>
                  <span className="text-sm font-bold text-gray-400 capitalize">{key === 'babies' ? 'Infants' : key}</span>
                </div>
                
                <div className="flex items-center gap-5">
                  <button
                    onClick={() => updateCount(key, -1)}
                    className="w-12 h-12 flex items-center justify-center bg-white shadow-sm border border-gray-100 rounded-2xl text-gray-400 active:scale-75 active:bg-blue-50 active:text-blue-500 transition-all"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  
                  <input
                    type="number"
                    inputMode="numeric"
                    value={counts[key]}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="w-14 text-center text-2xl font-black text-[#0072BC] bg-transparent outline-none focus:ring-0"
                  />
                  
                  <button
                    onClick={() => updateCount(key, 1)}
                    className="w-12 h-12 flex items-center justify-center bg-white shadow-sm border border-gray-100 rounded-2xl text-gray-400 active:scale-75 active:bg-blue-50 active:text-blue-500 transition-all"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-1 flex-shrink-0">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full h-16 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-blue-200
              ${isSaving ? 'bg-gray-100 text-blue-400' : 'bg-[#0072BC] text-white active:scale-[0.97]'}
            `}
          >
            {isSaving ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

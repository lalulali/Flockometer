"use client";

import React from "react";
import { ServiceCounts } from "@/hooks/useCounterState";
import { ClipboardList, CheckCircle2, Loader2, WifiOff } from "lucide-react";
import { useIsOnline } from "@/hooks/useIsOnline";

interface SummaryModalProps {
  isOpen: boolean;
  mainService: ServiceCounts;
  kidsService: ServiceCounts;
  date: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function SummaryModal({
  isOpen,
  mainService,
  kidsService,
  date,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: SummaryModalProps) {
  const isOnline = useIsOnline();
  if (!isOpen) return null;

  const mainTotal = mainService.adults + mainService.kids + mainService.babies;
  const kidsTotal = kidsService.adults + kidsService.kids + kidsService.babies;
  const grandTotal = mainTotal + kidsTotal;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-md mx-auto flex flex-col min-h-full p-6">
        <div className="flex flex-col items-center mb-6 pt-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardList className="w-6 h-6 text-[#0072BC]" />
          </div>
          <h2 className="text-xl font-bold text-[#1F2937] tracking-tight">Summary</h2>
          <span className="text-[10px] font-medium text-gray-400 mt-1">
            {formatDate(date)}
          </span>
        </div>
        
        <div className="space-y-4 mb-8">
          {/* Service Breakdown */}
          {[
            { label: "Main Service", data: mainService, total: mainTotal },
            { label: "Kids Service", data: kidsService, total: kidsTotal }
          ].map((service, idx) => (
            <div key={idx} className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-[#0072BC]">{service.label}</span>
                <span className="text-lg font-bold">{service.total}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center py-2 bg-white rounded-xl border border-gray-50">
                  <span className="text-sm font-bold">{service.data.kids}</span>
                  <span className="text-[8px] font-medium text-gray-400">Kids</span>
                </div>
                <div className="flex flex-col items-center py-2 bg-white rounded-xl border border-gray-50">
                  <span className="text-sm font-bold">{service.data.babies}</span>
                  <span className="text-[8px] font-medium text-gray-400">Babies</span>
                </div>
                <div className="flex flex-col items-center py-2 bg-white rounded-xl border border-gray-50">
                  <span className="text-sm font-bold">{service.data.adults}</span>
                  <span className="text-[8px] font-medium text-gray-400">Adults</span>
                </div>
              </div>
            </div>
          ))}

          {/* Grand Total */}
          <div className="bg-gradient-to-br from-[#0072BC] to-[#0092EA] rounded-2xl p-5 flex justify-between items-center text-white shadow-xl shadow-blue-100/30">
            <span className="text-sm font-bold">Grand Total</span>
            <span className="text-4xl font-bold leading-none">{grandTotal}</span>
          </div>
        </div>

        {!isOnline && (
          <div className="mb-6 p-4 bg-amber-50 rounded-[1.5rem] border border-amber-200/50 flex items-start gap-4">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <WifiOff className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-900 leading-tight">Currently Offline</p>
              <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                You can continue counting, but submission requires an internet connection. Your progress is saved locally.
              </p>
            </div>
          </div>
        )}
        
        <div className="flex-1" />
        
        <div className="grid grid-cols-2 gap-3 mt-8 pb-4">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-12 bg-gray-50 text-gray-500 text-sm font-bold rounded-2xl active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting || !isOnline}
            className={`h-12 font-bold text-sm rounded-2xl active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 ${
              isOnline ? "bg-[#0072BC] text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
            }`}
          >
            {isSubmitting ? (
               <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {isOnline ? "Confirm" : "Go Online to Submit"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { ServiceCounts } from "@/hooks/useCounterState";
import { ClipboardList, CheckCircle2, Loader2, X } from "lucide-react";

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
    <div className="fixed inset-0 bg-[#F3F4F6]/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-10 duration-300">
        <div className="p-8">
          <div className="w-16 h-16 bg-[#0072BC]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            <ClipboardList className="w-8 h-8 text-[#0072BC]" />
          </div>
          <h2 className="text-xl font-black text-[#1F2937] text-center mb-2">
            Confirm Submission
          </h2>
          <p className="text-gray-400 text-xs text-center font-bold tracking-widest uppercase mb-8">
            {formatDate(date)}
          </p>
          
          <div className="space-y-6 mb-8 bg-[#F3F4F6] p-6 rounded-2xl border border-gray-100/50">
            <div className="space-y-4">
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 underline decoration-blue-200 underline-offset-4">Main Service</h4>
                  <div className="flex justify-between items-center bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold">{mainService.adults}</span>
                        <span className="text-[8px] uppercase font-black opacity-30">Adl</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-200" />
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold">{mainService.kids}</span>
                        <span className="text-[8px] uppercase font-black opacity-30">Kid</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-200" />
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold">{mainService.babies}</span>
                        <span className="text-[8px] uppercase font-black opacity-30">Bby</span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-[#0072BC]">{mainTotal}</span>
                  </div>
               </div>

               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 underline decoration-blue-200 underline-offset-4">Kids Service</h4>
                  <div className="flex justify-between items-center bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold">{kidsService.adults}</span>
                        <span className="text-[8px] uppercase font-black opacity-30">Adl</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-200" />
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold">{kidsService.kids}</span>
                        <span className="text-[8px] uppercase font-black opacity-30">Kid</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-gray-200" />
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold">{kidsService.babies}</span>
                        <span className="text-[8px] uppercase font-black opacity-30">Bby</span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-[#0072BC]">{kidsTotal}</span>
                  </div>
               </div>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-gray-500 tracking-[0.2em]">Grand Total</span>
              <span className="text-4xl font-black text-[#1F2937] drop-shadow-sm">{grandTotal}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="w-full h-16 bg-[#0072BC] text-white font-bold rounded-2xl active:scale-95 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                 <>
                   <Loader2 className="w-6 h-6 animate-spin" />
                   SUBMITTING...
                 </>
              ) : (
                <>
                  <CheckCircle2 className="w-6 h-6" />
                  SUBMIT TO AIRTABLE
                </>
              )}
            </button>
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full h-14 bg-[#F3F4F6] text-[#1F2937] font-bold rounded-2xl active:scale-95 transition-all"
            >
              CANCEL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

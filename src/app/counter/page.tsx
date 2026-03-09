"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCounterState } from "@/hooks/useCounterState";
import CounterDisplay from "@/components/counter/CounterDisplay";
import ServiceToggle from "@/components/counter/ServiceToggle";
import CounterInputBar from "@/components/counter/CounterInputBar";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import SummaryModal from "@/components/ui/SummaryModal";
import Toast, { ToastType } from "@/components/ui/Toast";

import { Undo2, RotateCcw, WifiOff } from "lucide-react";
import { useIsOnline } from "@/hooks/useIsOnline";

const SUBMIT_VARIANT = (process.env.NEXT_PUBLIC_SUBMIT_BUTTON_POSITION || "sticky-bar") as "sticky-bar" | "hero-card";

export default function CounterPage() {
  const queryClient = useQueryClient();
  const isOnline = useIsOnline();
  const {
    state,
    activeCounts,
    canUndo,
    increment,
    decrement,
    undo,
    clearTab,
    switchTab,
    resetAll,
    setCount,
  } = useCounterState();

  const totalMain = state.mainService.adults + state.mainService.kids + state.mainService.babies;
  const totalKids = state.kidsService.adults + state.kidsService.kids + state.kidsService.babies;
  const grandTotal = totalMain + totalKids;

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType; show: boolean }>({
    message: "",
    type: "success",
    show: false,
  });

  const showToastMsg = (message: string, type: ToastType = "success") => {
    setToast({ message, type, show: true });
  };

  const closeToast = () => setToast((prev) => ({ ...prev, show: false }));

  const handleSubmitClick = () => {
    setIsSummaryModalOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: state.date,
          mainService: state.mainService,
          kidsService: state.kidsService,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit attendance');
      }

      setIsSummaryModalOpen(false);
      showToastMsg("Attendance submitted successfully!");
      resetAll(); // Reset both services to zero
      // Invalidate dashboard cache so it picks up new data immediately
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
    } catch (err: any) {
      console.error("Submission error:", err);
      showToastMsg(err.message || "Failed to submit. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* 1. Header & Quick Actions (Corner Buttons) */}
      <header className="pt-6 pb-2 px-5 flex flex-col items-center flex-shrink-0 relative">
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`absolute left-5 top-7 p-2 rounded-xl transition-all ${
            canUndo ? "text-gray-400 active:bg-gray-100" : "text-gray-100"
          }`}
          aria-label="Undo"
        >
          <Undo2 className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center pt-2">
          <img src="/logo.svg" alt="Flockometer" className="h-[24px] w-auto" />
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-medium text-gray-400 tracking-wide">
            {formatDate(state.date)}
          </span>
          {!isOnline && (
            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-bold rounded-lg uppercase tracking-wide ring-1 ring-amber-200/50">
              <WifiOff className="w-2.5 h-2.5" />
              Offline
            </span>
          )}
        </div>

        <button
          onClick={() => setIsResetModalOpen(true)}
          className="absolute right-5 top-7 p-2 rounded-xl text-gray-400 active:bg-gray-100 transition-all"
          aria-label="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </header>

      {/* 2. Content Sections - Tightly stacked */}
      <div className="px-5 flex flex-col space-y-4 pt-2">
        <CounterDisplay 
          counts={activeCounts} 
          grandTotal={grandTotal}
          onSetCount={setCount}
        />
        
        <ServiceToggle activeTab={state.activeTab} onSwitch={switchTab} />
      </div>

      <div className="flex-1" />

      {/* 5. Fixed Interaction Area (Sticky Bottom for thumb focus) */}
      <div className="bg-white flex-shrink-0 pt-4 z-40">
        <CounterInputBar 
          onIncrement={increment} 
          onDecrement={decrement} 
        />

        <div className="px-5 pb-4">
          <button 
            onClick={handleSubmitClick}
            disabled={grandTotal === 0}
            className={`w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-bold tracking-wider text-xs transition-all shadow-lg 
              ${grandTotal > 0 
                ? "bg-[#0072BC] text-white active:scale-[0.98] shadow-blue-50" 
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
              }`}
          >
            Submit Data
          </button>
        </div>
      </div>

      {/* Modals */}
      <ConfirmationModal 
        isOpen={isResetModalOpen}
        onConfirm={() => {
          clearTab();
          setIsResetModalOpen(false);
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <SummaryModal 
        isOpen={isSummaryModalOpen}
        mainService={state.mainService}
        kidsService={state.kidsService}
        date={state.date}
        onConfirm={handleConfirmedSubmit}
        onCancel={() => setIsSummaryModalOpen(false)}
        isSubmitting={isSubmitting}
      />

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.show} 
        onClose={closeToast} 
      />
    </div>
  );
}

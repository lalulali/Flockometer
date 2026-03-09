"use client";

import React, { useState } from "react";
import { useCounterState } from "@/hooks/useCounterState";
import CounterDisplay from "@/components/counter/CounterDisplay";
import ServiceToggle from "@/components/counter/ServiceToggle";
import CounterInputBar from "@/components/counter/CounterInputBar";
import CounterActions from "@/components/counter/CounterActions";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import SummaryModal from "@/components/ui/SummaryModal";

const SUBMIT_VARIANT = (process.env.NEXT_PUBLIC_SUBMIT_BUTTON_POSITION || "sticky-bar") as "sticky-bar" | "hero-card";

export default function CounterPage() {
  const {
    state,
    activeCounts,
    canUndo,
    increment,
    decrement,
    undo,
    clearTab,
    switchTab,
  } = useCounterState();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitClick = () => {
    setIsSummaryModalOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    setIsSubmitting(true);
    // TODO: Wire up to actual API in Task 8
    console.log("Submitting to Airtable...", {
      date: state.date,
      mainService: state.mainService,
      kidsService: state.kidsService,
    });
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSummaryModalOpen(false);
    alert("Submission (simulated) successful!");
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
    <div className="flex flex-col min-h-full">
      <header className="p-6 pb-2">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-black text-[#1F2937] tracking-tight">ATTENDANCE TRACKER</h1>
          <div className="bg-[#F3F4F6] px-3 py-1 rounded-full">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formatDate(state.date)}</span>
          </div>
        </div>

        <CounterDisplay 
          counts={activeCounts} 
          onSubmit={handleSubmitClick} 
          variant={SUBMIT_VARIANT}
        />
      </header>

      <div className="flex-1 px-6 flex flex-col pt-4">
        <ServiceToggle activeTab={state.activeTab} onSwitch={switchTab} />
        
        <CounterActions 
          onUndo={undo} 
          onReset={() => setIsResetModalOpen(true)} 
          canUndo={canUndo} 
        />

        <CounterInputBar 
          onIncrement={increment} 
          onDecrement={decrement} 
        />
      </div>

      {SUBMIT_VARIANT === "sticky-bar" && (
        <div className="px-6 py-4 mt-8">
           <button 
             onClick={handleSubmitClick}
             className="btn-primary w-full h-16 shadow-xl shadow-blue-100/50 flex items-center justify-center gap-2"
           >
             SUBMIT TO AIRTABLE
           </button>
        </div>
      )}

      {/* Spacing for FAB Navbar */}
      <div className="h-6" />

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
    </div>
  );
}

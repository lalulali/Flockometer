"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title = "Reset tab?",
  message = "This will clear all counts for this tab. This action cannot be undone.",
  confirmLabel = "Reset now",
  cancelLabel = "Cancel",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#F3F4F6]/90 backdrop-blur-sm z-[100] flex items-center justify-center p-8 transition-all">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-6 border border-gray-100">
        <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-5 mx-auto">
          <AlertTriangle className="w-6 h-6 text-[#EF4444]" />
        </div>
        <h2 className="text-xl font-bold text-[#1F2937] text-center tracking-tight mb-2">
          {title}
        </h2>
        <p className="text-gray-400 text-sm text-center font-medium leading-relaxed mb-8">
          {message}
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="h-12 bg-gray-50 text-gray-500 text-sm font-bold rounded-2xl active:scale-95 transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="h-12 bg-[#EF4444] text-white font-bold text-sm rounded-2xl active:scale-95 transition-all shadow-lg shadow-red-100"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

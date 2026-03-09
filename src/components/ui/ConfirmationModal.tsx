"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

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
  title = "Reset Counts?",
  message = "This will clear all counts for the active service tab. This action cannot be undone.",
  confirmLabel = "Reset Current Tab",
  cancelLabel = "Keep Counts",
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#F3F4F6]/80 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 animate-in slide-in-from-bottom-10 duration-300">
        <div className="p-8">
          <div className="w-16 h-16 bg-[#EF4444]/10 rounded-full flex items-center justify-center mb-6 mx-auto">
            <AlertTriangle className="w-8 h-8 text-[#EF4444]" />
          </div>
          <h2 className="text-xl font-black text-[#1F2937] text-center mb-3">
            {title}
          </h2>
          <p className="text-gray-400 text-sm text-center leading-relaxed mb-8">
            {message}
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onConfirm}
              className="w-full h-14 bg-[#EF4444] text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-red-100/50"
            >
              {confirmLabel}
            </button>
            <button
              onClick={onCancel}
              className="w-full h-14 bg-[#F3F4F6] text-[#1F2937] font-bold rounded-2xl active:scale-95 transition-all"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

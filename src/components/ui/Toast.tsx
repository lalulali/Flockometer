"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X, Info } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  isVisible: boolean;
}

export default function Toast({ message, type = "success", duration = 3000, onClose, isVisible }: ToastProps) {
  const [shouldRender, setShouldRender] = useState(isVisible);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!shouldRender) return null;

  const config = {
    success: {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      progress: "bg-emerald-500"
    },
    error: {
      icon: <AlertCircle className="w-5 h-5 text-rose-500" />,
      bg: "bg-rose-50",
      border: "border-rose-100",
      progress: "bg-rose-500"
    },
    info: {
      icon: <Info className="w-5 h-5 text-blue-500" />,
      bg: "bg-blue-50",
      border: "border-blue-100",
      progress: "bg-blue-500"
    }
  };

  const { icon, bg, border, progress } = config[type];

  return (
    <div 
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-40px)] max-w-[360px] 
        transition-all duration-300 transform 
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-8 opacity-0 scale-95 pointer-events-none'}`}
    >
      <div className={`${bg} ${border} border rounded-2xl p-4 shadow-xl shadow-gray-200/50 flex items-center gap-3 relative overflow-hidden`}>
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-800 leading-tight">{message}</p>
        </div>
        <button 
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-full active:bg-black/5 transition-colors"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-1 w-full bg-black/5">
          <div 
            className={`h-full ${progress} transition-all duration-linear`} 
            style={{ 
              width: isVisible ? '0%' : '100%',
              transitionDuration: `${duration}ms`
            }} 
          />
        </div>
      </div>
    </div>
  );
}

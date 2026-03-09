"use client";

import React, { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detect if already installed or dismissed recently
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches 
      || (window.navigator as any).standalone;

    if (isStandalone) {
      return;
    }

    const dismissedAt = localStorage.getItem("pwa_prompt_dismissed_at");
    if (dismissedAt) {
      const cooldownMinutes = parseInt(process.env.NEXT_PUBLIC_PWA_PROMPT_DISMISS_MINUTES || "1440", 10);
      const cooldownMs = cooldownMinutes * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt, 10) < cooldownMs) {
        return;
      }
    }

    // 2. Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // 3. Handle Chrome/Android prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a short delay
      setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // 4. For iOS, show prompt after a delay since there's no event
    if (ios) {
      // Check if it's already in standalone mode
      if (!(window.navigator as any).standalone) {
        setTimeout(() => setShow(true), 4000);
      }
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShow(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa_prompt_dismissed_at", Date.now().toString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-[60] animate-in fade-in slide-in-from-bottom-full duration-700">
      <div className="bg-white border-t border-gray-100 rounded-t-[32px] shadow-[0_-20px_50px_-15px_rgba(0,0,0,0.15)] p-6 pb-10 flex flex-col gap-6">
        <div className="flex items-start justify-between text-left">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-[#0072BC] rounded-[22px] flex items-center justify-center overflow-hidden shadow-lg shadow-blue-500/10">
              <img src="/icon.png" alt="Flockometer" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-extrabold text-[#1F2937] text-xl leading-none">Install Flockometer</h3>
              <p className="text-[12px] text-gray-500 font-semibold tracking-tight">Access IFGF Attendance Counter anywhere</p>
            </div>
          </div>
          <button 
            onClick={handleDismiss} 
            className="p-2 bg-gray-50 rounded-full text-gray-400 active:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIOS ? (
          <div className="bg-blue-50/50 rounded-2xl p-5 flex items-center gap-5 border border-blue-100/30">
            <div className="p-3 bg-white rounded-[16px] shadow-sm">
              <Share className="w-5 h-5 text-[#0072BC]" />
            </div>
            <p className="text-[12px] text-gray-600 leading-snug font-semibold">
              Tap <span className="text-[#0072BC]">Share</span> then <span className="text-[#0072BC]">"Add to Home Screen"</span> to install on your iPhone.
            </p>
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="w-full py-5 bg-[#0072BC] text-white rounded-[20px] font-extrabold text-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-blue-500/25"
          >
            <Download className="w-5 h-5" />
            INSTALL NOW
          </button>
        )}
      </div>
    </div>
  );
}

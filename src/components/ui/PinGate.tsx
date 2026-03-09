"use client";

import React, { useState, useEffect } from "react";
import { Lock } from "lucide-react";

interface PinGateProps {
  children: React.ReactNode;
}

export default function PinGate({ children }: PinGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isMounting, setIsMounting] = useState<boolean>(true);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  useEffect(() => {
    const authed = sessionStorage.getItem("flockometer_authed");
    if (authed === "true") {
      setIsAuthenticated(true);
    }
    setIsMounting(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = process.env.NEXT_PUBLIC_ACCESS_PIN;

    if (pin === correctPin) {
      sessionStorage.setItem("flockometer_authed", "true");
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError("Incorrect PIN");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
      setPin("");
    }
  };

  if (isMounting) return null;

  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F3F4F6]">
      <div className={`w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 border border-gray-100 ${isShaking ? 'animate-shake' : ''}`}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-[#0072BC]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1F2937]">FLOCKOMETER</h1>
          <p className="text-gray-500 text-sm">IFGF Attendance Counter</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 block ml-1">
              Enter Access PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-2xl tracking-[1em] focus:outline-none focus:ring-2 focus:ring-[#0072BC]/20 focus:border-[#0072BC] transition-all"
              placeholder="••••"
              autoFocus
            />
            {error && (
              <p className="text-[#EF4444] text-sm text-center font-medium mt-2 animate-in fade-in slide-in-from-top-1">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full btn-primary h-14"
          >
            ENTER
          </button>
        </form>
      </div>
    </div>
  );
}

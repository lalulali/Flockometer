"use client";

import React, { useState, useEffect, useRef } from "react";

interface PinGateProps {
  children: React.ReactNode;
}

export default function PinGate({ children }: PinGateProps) {
  const correctPin = process.env.NEXT_PUBLIC_ACCESS_PIN || "";
  const pinLength = correctPin.length || 6;
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinValue, setPinValue] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isMounting, setIsMounting] = useState<boolean>(true);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeoutMinutes = parseInt(process.env.NEXT_PUBLIC_PIN_TIMEOUT_MINUTES || "1440", 10);
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const lastActiveStr = localStorage.getItem("flockometer_authed_timestamp");
    
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      if (Date.now() - lastActive < timeoutMs) {
        setIsAuthenticated(true);
        localStorage.setItem("flockometer_authed_timestamp", Date.now().toString());
      } else {
        localStorage.removeItem("flockometer_authed_timestamp");
      }
    }
    setIsMounting(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, pinLength);
    setPinValue(val);
    if (error) setError(null);
  };

  const validatePin = (val: string) => {
    if (val === correctPin) {
      localStorage.setItem("flockometer_authed_timestamp", Date.now().toString());
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError("Incorrect PIN");
      setIsShaking(true);
      setTimeout(() => {
        setIsShaking(false);
        setPinValue("");
      }, 400);
    }
  };

  useEffect(() => {
    if (pinValue.length === pinLength) {
      validatePin(pinValue);
    }
  }, [pinValue, pinLength]);

  if (isMounting) return null;
  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#F3F4F6] transition-all overflow-hidden">
      <div className={`w-full max-w-md mx-auto h-full bg-white shadow-xl flex flex-col items-center justify-center p-4 ${isShaking ? 'animate-shake' : ''}`}>
        <div className="w-full max-w-[280px] flex flex-col items-center">
          <div className="flex flex-col items-center mb-12">
            <img src="/logo.svg" alt="Flockometer" className="h-[32px] w-auto mb-3" />
            <p className="text-gray-400 font-medium text-xs tracking-wide">IFGF Attendance Counter</p>
          </div>

          <div className="w-full space-y-8">
            <div className="space-y-6">
              <p className="text-center text-sm font-semibold text-[#1F2937]/40 tracking-tight">
                Enter your access PIN
              </p>
              
              <div className="relative group">
                <input
                  ref={inputRef}
                  type="password"
                  autoComplete="one-time-code"
                  maxLength={pinLength}
                  value={pinValue}
                  onChange={handleChange}
                  placeholder="••••••"
                  autoFocus
                  className={`w-full h-16 text-center text-4xl font-mono tracking-[0.3em] border-2 rounded-2xl transition-all outline-none 
                    placeholder:text-gray-300 placeholder:tracking-[0.35em]
                    ${pinValue.length > 0 
                      ? "border-[#0072BC] bg-blue-50/10 text-[#0072BC]" 
                      : "border-gray-50 bg-gray-50/50 text-gray-800 focus:border-[#0072BC]/30"
                    }
                    ${error ? "border-red-100 bg-red-50/20" : ""}
                  `}
                  style={{ paddingLeft: "0.3em" }}
                />
              </div>

              {error && (
                <p className="text-[#EF4444] text-[11px] text-center font-bold mt-2 tracking-wide uppercase">
                  {error}
                </p>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-[10px] text-gray-400 font-medium italic">
                Secure gateway for authorized personnel only
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

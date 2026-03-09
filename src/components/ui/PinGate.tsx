"use client";

import React, { useState, useEffect, useRef } from "react";

interface PinGateProps {
  children: React.ReactNode;
}

export default function PinGate({ children }: PinGateProps) {
  const correctPin = process.env.NEXT_PUBLIC_ACCESS_PIN || "";
  const pinLength = correctPin.length || 6;
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pin, setPin] = useState<string[]>(new Array(pinLength).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [isMounting, setIsMounting] = useState<boolean>(true);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timeoutMinutes = parseInt(process.env.NEXT_PUBLIC_PIN_TIMEOUT_MINUTES || "1440", 10);
    const timeoutMs = timeoutMinutes * 60 * 1000;
    const lastActiveStr = localStorage.getItem("flockometer_authed_timestamp");
    
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      if (Date.now() - lastActive < timeoutMs) {
        setIsAuthenticated(true);
        // Renew the timestamp since it's being used
        localStorage.setItem("flockometer_authed_timestamp", Date.now().toString());
      } else {
        localStorage.removeItem("flockometer_authed_timestamp");
      }
    }
    setIsMounting(false);
  }, []);

  const handleChange = (value: string, index: number) => {
    if (value.length > 1) value = value[value.length - 1];
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Filter out potential errors when user starts typing again
    if (error) setError(null);

    // Move to next input if value is entered
    if (value !== "" && index < pinLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && pin[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const submittedPin = pin.join("");
    
    if (submittedPin === correctPin) {
      localStorage.setItem("flockometer_authed_timestamp", Date.now().toString());
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError("Incorrect PIN");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);
      setPin(new Array(pinLength).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  // Auto-submit when last box is filled
  useEffect(() => {
    if (pin.every(digit => digit !== "") && pin.length === pinLength) {
      handleSubmit();
    }
  }, [pin, pinLength]);

  if (isMounting) return null;
  if (isAuthenticated) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#F3F4F6] transition-all overflow-hidden">
      <div className={`w-full max-w-md mx-auto h-full bg-white shadow-xl flex flex-col items-center justify-center p-4 ${isShaking ? 'animate-shake' : ''}`}>
        <div className="w-full max-w-[280px] flex flex-col items-center">
          <div className="flex flex-col items-center mb-10">
            <img src="/logo.svg" alt="Flockometer" className="h-[28px] w-auto mb-2" />
            <p className="text-gray-400 font-medium text-xs tracking-wide">Ifgf Attendance Counter</p>
          </div>

          <div className="w-full space-y-10">
            <div className="space-y-6">
              <p className="text-center text-sm font-semibold text-[#1F2937]/30">
                Enter access pin
              </p>
              
              <div className="flex justify-center w-full gap-1.5">
                {pin.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="password"
                    inputMode="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e.target.value, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`w-10 h-12 text-center text-3xl border-2 rounded-xl transition-all outline-none focus:ring-0 leading-[3rem]
                      ${digit 
                        ? "border-[#0072BC] bg-blue-50/20 text-[#0072BC]" 
                        : "border-gray-50 bg-gray-50/50 text-gray-800 focus:border-[#0072BC]/20"
                      }
                    `}
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              {error && (
                <p className="text-[#EF4444] text-xs text-center font-bold mt-2 animate-shake">
                  {error}
                </p>
              )}
            </div>

            <button
              onClick={() => handleSubmit()}
              className="w-full bg-[#0072BC] text-white h-14 rounded-2xl font-bold text-sm tracking-widest active:scale-[0.98] transition-all shadow-lg shadow-blue-100/50"
            >
              Verify
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

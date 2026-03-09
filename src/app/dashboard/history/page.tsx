"use client";

import React, { Suspense, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDashboardData, AttendanceRecord } from "@/hooks/useDashboardData";
import { ChevronLeft, History, Check, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import Toast, { ToastType } from "@/components/ui/Toast";

const SERVICE_COLORS: Record<string, string> = {
    "Main Service": "bg-blue-50 text-[#0072BC]",
    "Kids Service": "bg-emerald-50 text-emerald-600",
};

interface TaggedRecord extends AttendanceRecord {
    isMain: boolean;
    labelOverride?: string;
}

function HistoryDetail() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const date = searchParams.get("date");
    const type = searchParams.get("type");

    const [restoringId, setRestoringId] = useState<string | null>(null);
    const { getServiceHistory, isLoading, refetch } = useDashboardData();
    const [toast, setToast] = useState<{ message: string; type: ToastType; show: boolean }>({
        message: "",
        type: "success",
        show: false,
    });

    const showToastMsg = (message: string, type: ToastType = "success") => {
        setToast({ message, type, show: true });
    };

    /** Process history to add semantic tags (Latest vs Active) and sort by timestamp */
    const processedHistory = useMemo(() => {
        if (!date || !type) return [];
        const raw = getServiceHistory(date, type);
        if (raw.length === 0) return [];

        const tagged: TaggedRecord[] = raw.map((r, idx) => ({
            ...r,
            isMain: idx === 0
        }));

        const chronological = [...tagged].sort((a, b) => a.dateRaw.localeCompare(b.dateRaw));
        const maxTime = chronological[chronological.length - 1].dateRaw;

        const withLabels = chronological.map((r, idx) => {
            let label = "";
            if (r.dateRaw === maxTime) label = "Latest Version";
            else label = `Version ${idx + 1}`;
            return { ...r, labelOverride: label };
        });

        return withLabels.sort((a, b) => b.dateRaw.localeCompare(a.dateRaw));
    }, [date, type, getServiceHistory]);

    const handleUseVersion = async (record: TaggedRecord) => {
        setRestoringId(record.id);
        try {
            const raw = getServiceHistory(date!, type!);
            const masterId = raw[0].id;

            if (!masterId) throw new Error("Could not find master record ID");

            const res = await fetch("/api/attendance", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    recordId: masterId,
                    versionId: record.dateRaw
                })
            });

            if (!res.ok) throw new Error("Failed to restore version");

            showToastMsg("Version restored successfully!");
            await refetch();

            setTimeout(() => {
                router.push("/dashboard");
            }, 1000);
        } catch (e) {
            console.error(e);
            showToastMsg("Failed to restore version", "error");
        } finally {
            setRestoringId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-8 h-8 text-[#0072BC] animate-spin" />
                <p className="text-sm font-semibold text-gray-400">Loading history...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50/30 overflow-y-auto no-scrollbar relative">
            <header className="bg-white border-b border-gray-100 p-5 sticky top-0 z-10 flex items-center justify-between">
                <Link
                    href="/dashboard"
                    className="p-2 -ml-2 rounded-xl text-gray-400 active:bg-gray-50 transition-all"
                >
                    <ChevronLeft className="w-6 h-6" />
                </Link>
                <div className="flex-1 px-4 text-center">
                    <h1 className="text-sm font-bold text-gray-800 tracking-tight leading-tight">
                        Submission History
                    </h1>
                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5">
                        {date} • {type}
                    </p>
                </div>
                <div className="w-10" />
            </header>

            <div className="p-5 space-y-4 pb-16">
                <div className="flex items-center gap-2 mb-1">
                    <History className="w-3.5 h-3.5 text-[#0072BC]" />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Version Log</span>
                </div>

                {processedHistory.length === 0 ? (
                    <div className="bg-white rounded-2xl p-8 text-center text-gray-400 font-medium text-sm border border-dashed border-gray-200">
                        No submission records found
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {processedHistory.map((record) => {
                            const isActive = record.isMain;
                            const isRestoring = restoringId === record.id;

                            return (
                                <div
                                    key={record.id}
                                    className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 transition-all ${
                                        isActive ? 'border-[#0072BC]/40 ring-4 ring-[#0072BC]/5' : 'border-gray-100'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className={`text-[10px] font-bold uppercase tracking-tight ${isActive ? 'text-[#0072BC]' : 'text-gray-400'}`}>
                                                    {record.labelOverride}
                                                </span>
                                                {isActive && (
                                                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-[#0072BC] text-[8px] font-black rounded-md uppercase tracking-tighter ring-1 ring-[#0072BC]/10">
                                                        <Check className="w-2 h-2" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-gray-800">
                                                {new Date(record.dateRaw).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className={`${SERVICE_COLORS[record.serviceType]} px-2.5 py-1 rounded-lg text-[10px] font-bold`}>
                                            {record.total} Total
                                        </div>
                                    </div>

                                    {/* Breakdown: More Lean */}
                                    <div className="grid grid-cols-3 gap-1 bg-gray-50/50 rounded-xl p-1.5 border border-gray-50">
                                        <div className="text-center py-1">
                                            <p className="text-sm font-bold text-gray-800">{record.adults}</p>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Adults</p>
                                        </div>
                                        <div className="text-center py-1 border-x border-gray-100">
                                            <p className="text-sm font-bold text-gray-800">{record.kids}</p>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Kids</p>
                                        </div>
                                        <div className="text-center py-1">
                                            <p className="text-sm font-bold text-gray-800">{record.babies}</p>
                                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">Babies</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => !isActive && handleUseVersion(record)}
                                        disabled={isActive || !!restoringId}
                                        className={`w-full h-9 rounded-xl font-bold text-[10px] flex items-center justify-center gap-2 transition-all
                                            ${isActive
                                                ? 'bg-gray-50 text-gray-300 border border-gray-100 cursor-default shadow-none'
                                                : isRestoring
                                                    ? 'bg-gray-100 text-[#0072BC] animate-pulse'
                                                    : 'bg-[#0072BC] text-white shadow-sm shadow-blue-100 active:scale-[0.98]'
                                            }
                                        `}
                                    >
                                        {isRestoring ? (
                                            <>
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Activating...
                                            </>
                                        ) : isActive ? (
                                            <>
                                                <Check className="w-3 h-3" />
                                                Active Version
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-3 h-3" />
                                                Use this version
                                                <ArrowRight className="w-3 h-3 ml-0.5 opacity-50" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Toast
                message={toast.message}
                type={toast.type}
                isVisible={toast.show}
                onClose={() => setToast(prev => ({ ...prev, show: false }))}
            />
        </div>
    );
}

export default function HistoryDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <Loader2 className="w-8 h-8 text-[#0072BC] animate-spin" />
                <p className="text-sm font-semibold text-gray-400">Loading...</p>
            </div>
        }>
            <HistoryDetail />
        </Suspense>
    );
}

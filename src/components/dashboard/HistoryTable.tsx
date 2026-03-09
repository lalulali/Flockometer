"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Filter, ChevronRight, ChevronLeft, ChevronRight as ChevronRightIcon, Edit3 } from "lucide-react";
import type { AttendanceRecord } from "@/hooks/useDashboardData";
import ExportButton from "./ExportButton";
import EditHistoryModal from "./EditHistoryModal";
import { useQueryClient } from "@tanstack/react-query";
import Toast, { ToastType } from "../ui/Toast";

interface HistoryTableProps {
  records: AttendanceRecord[];
  filteredRecords: (dateFrom?: string, dateTo?: string) => AttendanceRecord[];
}

function getDefaultDateRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 28); // last 4 weeks
  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

const SERVICE_COLORS: Record<string, string> = {
  "Main Service": "bg-blue-50 text-[#0072BC]",
  "Kids Service": "bg-emerald-50 text-emerald-600",
};

export default function HistoryTable({ records, filteredRecords }: HistoryTableProps) {
  const queryClient = useQueryClient();
  const defaults = getDefaultDateRange();
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [serviceType, setServiceType] = useState<string>("All");
  const [showFilter, setShowFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType; show: boolean }>({
    message: "",
    type: "success",
    show: false,
  });

  const showToastMsg = (message: string, type: ToastType = "success") => {
    setToast({ message, type, show: true });
  };

  const filtered = useMemo(() => {
    let currentRecords = filteredRecords(dateFrom, dateTo);
    if (serviceType !== "All") {
      currentRecords = currentRecords.filter(r => r.serviceType === serviceType);
    }
    const seen = new Set<string>();
    const deduped: typeof currentRecords = [];
    for (const r of currentRecords) {
      const key = `${r.date}__${r.serviceType}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(r);
      }
    }
    return deduped;
  }, [filteredRecords, dateFrom, dateTo, serviceType]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, serviceType]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const handleSaveEdit = async (counts: { adults: number; kids: number; babies: number }) => {
    if (!editingRecord) return;
    try {
      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: editingRecord.id, // This is the Airtable record ID
          ...counts
        })
      });

      if (!res.ok) throw new Error("Failed to update");

      showToastMsg("Record updated and versioned!");
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
    } catch (e) {
      console.error(e);
      showToastMsg("Failed to update", "error");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <EditHistoryModal
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleSaveEdit}
        date={editingRecord?.date || ""}
        serviceType={editingRecord?.serviceType || ""}
        initialCounts={{
          adults: editingRecord?.adults || 0,
          kids: editingRecord?.kids || 0,
          babies: editingRecord?.babies || 0,
        }}
      />
      
      {/* Sticky Header */}
      <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 border-b border-gray-100/50">
        <div className="flex items-center justify-between px-5 py-5 pt-7">
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0072BC] mb-0.5">Records</h3>
            <p className="text-xs font-bold text-gray-800">
              {(() => {
                const dates = new Set(filtered.map(r => r.date));
                // A rough estimate of weeks based on unique dates (assuming 1-2 services per week)
                // More accurately: count unique year-week pairs if needed, but unique dates is a good start.
                const weekCount = Math.ceil(dates.size / 2); 
                return `${weekCount} ${weekCount === 1 ? 'Week' : 'Weeks'} · ${filtered.length} Records`;
              })()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton records={filtered} />
            <button
              onClick={() => setShowFilter((v) => !v)}
              className={`w-9 h-9 flex items-center justify-center rounded-full transition-all ${
                showFilter ? "text-[#0072BC] bg-blue-50" : "text-gray-400 active:bg-gray-100 active:scale-90"
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilter && (
          <div className="px-5 pb-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex bg-gray-50 p-1 rounded-2xl">
              {["All", "Main Service", "Kids Service"].map((type) => (
                <button
                  key={type}
                  onClick={() => setServiceType(type)}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-[0.9rem] transition-all ${
                    serviceType === type 
                      ? "bg-white text-[#0072BC] shadow-sm" 
                      : "text-gray-400"
                  }`}
                >
                  {type === "Main Service" ? "Main" : type === "Kids Service" ? "Kids" : "All"}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">From</label>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full text-xs border border-gray-100 rounded-xl px-3 py-2 text-gray-700 font-bold outline-none bg-gray-50/50"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">To</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full text-xs border border-gray-100 rounded-xl px-3 py-2 text-gray-700 font-bold outline-none bg-gray-50/50"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {paginated.length === 0 ? (
          <div className="h-40 flex items-center justify-center px-10 text-center text-xs text-gray-300 font-medium italic">
            No history records match the current filters.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {paginated.map((record) => (
              <div key={record.id} className="group relative flex items-center justify-between px-5 py-4.5 gap-3 hover:bg-gray-50/50 transition-all outline-none">
                <Link 
                  href={`/dashboard/history?date=${record.date}&type=${encodeURIComponent(record.serviceType)}`}
                  className="flex-1 min-w-0"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-gray-800">{record.date}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${SERVICE_COLORS[record.serviceType]}`}>
                        {record.serviceType === "Main Service" ? "Main" : "Kids"}
                      </span>
                    </div>
                    <div className="flex gap-2 text-[10px] font-bold text-gray-400">
                      <span>A: {record.adults}</span>
                      <span>·</span>
                      <span>K: {record.kids}</span>
                      <span>·</span>
                      <span>B: {record.babies}</span>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingRecord(record);
                    }}
                    className="w-9 h-9 flex items-center justify-center text-gray-400 rounded-full active:bg-gray-100 active:text-[#0072BC] active:scale-90 transition-all ml-1"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <Link 
                    href={`/dashboard/history?date=${record.date}&type=${encodeURIComponent(record.serviceType)}`}
                    className="flex items-center gap-3 active:bg-gray-100 p-1.5 rounded-xl transition-all"
                  >
                    <div className="bg-[#0072BC]/5 text-[#0072BC] px-3 py-1 rounded-lg font-bold text-sm tracking-tight">
                      {record.total}
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-gray-200" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        {/* Spacer for navbar */}
        <div className="h-20" />
      </div>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.show} 
        onClose={() => setToast(p => ({ ...p, show: false }))} 
      />

      {/* Persistent Pagination Bar */}
      <div className="absolute bottom-2 left-0 right-0 px-5 z-40">
        <div className="bg-white/80 backdrop-blur-xl border border-gray-100/50 shadow-2xl shadow-blue-900/10 rounded-2xl flex items-center justify-between p-1.5">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 active:bg-blue-50 active:text-[#0072BC] transition-all disabled:opacity-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none mb-0.5">Page</span>
            <span className="text-xs font-black text-gray-800 leading-none">
              {currentPage} <span className="text-gray-300 font-bold mx-0.5">/</span> {totalPages || 1}
            </span>
          </div>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 active:bg-blue-50 active:text-[#0072BC] transition-all disabled:opacity-20"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Download } from "lucide-react";
import type { AttendanceRecord } from "@/hooks/useDashboardData";
import { exportToExcel } from "@/lib/exportExcel";

interface ExportButtonProps {
  records: AttendanceRecord[];
}

export default function ExportButton({ records }: ExportButtonProps) {
  const handleExport = () => {
    if (records.length === 0) return;
    exportToExcel(records);
  };

  return (
    <button
      onClick={handleExport}
      disabled={records.length === 0}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
        ${records.length > 0
          ? "bg-[#0072BC] text-white active:scale-95 shadow-md shadow-blue-100"
          : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
    >
      <Download className="w-3.5 h-3.5" />
      Export
    </button>
  );
}

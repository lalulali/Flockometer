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
      className={`w-9 h-9 flex items-center justify-center rounded-full transition-all 
        ${records.length > 0
          ? "text-[#0072BC] active:bg-blue-50 active:scale-90"
          : "text-gray-200 cursor-not-allowed"
        }`}
      title="Download Excel"
    >
      <Download className="w-4 h-4" />
    </button>
  );
}

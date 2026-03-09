import type { AttendanceRecord } from "@/hooks/useDashboardData";
import * as XLSX from "xlsx";

export function exportToExcel(records: AttendanceRecord[], filename?: string) {
    const rows = records.map((r) => ({
        Date: r.date,
        "Service Type": r.serviceType,
        Adults: r.adults,
        Kids: r.kids,
        Babies: r.babies,
        Total: r.total,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Attendance");

    // Auto-size columns
    const colWidths = [
        { wch: 12 }, // Date
        { wch: 16 }, // Service Type
        { wch: 8 },  // Adults
        { wch: 8 },  // Kids
        { wch: 8 },  // Babies
        { wch: 8 },  // Total
    ];
    ws["!cols"] = colWidths;

    const today = new Date().toISOString().split("T")[0];
    const outputFilename = filename || `IFGF_Attendance_${today}.xlsx`;
    XLSX.writeFile(wb, outputFilename);
}

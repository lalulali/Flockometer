"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export interface AttendanceRecord {
    id: string;
    date: string;         // YYYY-MM-DD
    dateRaw: string;      // ISO datetime string from Airtable
    serviceType: string;  // "Main Service" | "Kids Service"
    adults: number;
    kids: number;
    babies: number;
    total: number;
    history: { adults: number; kids: number; babies: number; submittedAt: string }[];
}

interface AirtableRawRecord {
    id: string;
    fields: {
        Date?: string;
        ServiceType?: string;
        Adults?: number;
        Kids?: number;
        Babies?: number;
        Total?: number;
        History?: string;
    };
    createdTime: string;
}

interface AirtableResponse {
    success: boolean;
    data: {
        records: AirtableRawRecord[];
    };
}

const fetchRecords = async (): Promise<AttendanceRecord[]> => {
    const res = await fetch("/api/attendance?limit=200");
    if (!res.ok) throw new Error("Failed to fetch attendance data");
    const json = (await res.json()) as AirtableResponse;
    const raw = json.data?.records || [];

    return raw
        .map((r) => {
            const dateRaw = r.fields.Date || "";
            const dateKey = dateRaw.includes("T") ? dateRaw.split("T")[0] : dateRaw;
            const adults = r.fields.Adults || 0;
            const kids = r.fields.Kids || 0;
            const babies = r.fields.Babies || 0;

            let history = [];
            try {
                history = r.fields.History ? JSON.parse(r.fields.History) : [];
            } catch (e) {
                console.error("Failed to parse record history", e);
            }

            return {
                id: r.id,
                date: dateKey,
                dateRaw,
                serviceType: r.fields.ServiceType || "",
                adults,
                kids,
                babies,
                total: adults + kids + babies,
                history,
            };
        })
        .filter((r) => r.date)
        .sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            // Within same date, show Main Service first
            return b.serviceType.localeCompare(a.serviceType);
        });
};

/** Group records by date, producing chart-ready daily totals */
interface DailyData {
    name: string;      // e.g. "Mar 9"
    dateKey: string;   // "YYYY-MM-DD"
    mainTotal: number;
    kidsTotal: number;
    grandTotal: number;
    adults: number;
    kids: number;
    babies: number;
}

function groupByDate(records: AttendanceRecord[]): DailyData[] {
    const map = new Map<string, DailyData>();
    for (const r of records) {
        if (!map.has(r.date)) {
            map.set(r.date, {
                name: new Date(r.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                dateKey: r.date,
                mainTotal: 0,
                kidsTotal: 0,
                grandTotal: 0,
                adults: 0,
                kids: 0,
                babies: 0,
            });
        }
        const d = map.get(r.date)!;
        const isMain = r.serviceType === "Main Service";
        if (isMain) d.mainTotal += r.total;
        else d.kidsTotal += r.total;
        d.grandTotal += r.total;
        d.adults += r.adults;
        d.kids += r.kids;
        d.babies += r.babies;
    }
    // Sort oldest → newest for chart display
    return Array.from(map.values()).sort(
        (a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime()
    );
}

export function useDashboardData() {
    const query = useQuery<AttendanceRecord[]>({
        queryKey: ["attendance-records"],
        queryFn: fetchRecords,
        staleTime: 5 * 60 * 1000,
    });

    const records = query.data || [];

    const derived = useMemo(() => {
        const dailyData = groupByDate(records);
        const lastDay = dailyData[dailyData.length - 1];
        const prevDay = dailyData[dailyData.length - 2];

        const latestTotal = lastDay?.grandTotal ?? 0;
        const lastWeekTotal = prevDay?.grandTotal ?? 0;

        let weekOverWeekPercent: number | null = null;
        let trendDirection: "up" | "down" | "neutral" = "neutral";
        if (prevDay && lastWeekTotal > 0) {
            weekOverWeekPercent = ((latestTotal - lastWeekTotal) / lastWeekTotal) * 100;
            trendDirection = weekOverWeekPercent > 0 ? "up" : weekOverWeekPercent < 0 ? "down" : "neutral";
        }

        // Last 8 data points for charts
        const chartDataServices = dailyData.slice(-8);
        const chartDataBreakdown = dailyData.slice(-8);

        const filteredRecords = (dateFrom?: string, dateTo?: string): AttendanceRecord[] => {
            return records.filter((r) => {
                if (dateFrom && r.date < dateFrom) return false;
                if (dateTo && r.date > dateTo) return false;
                return true;
            });
        };

        const getServiceHistory = (date: string, serviceType: string): AttendanceRecord[] => {
            const master = records.find(r => r.date === date && r.serviceType === serviceType);
            if (!master) return [];

            // Current version
            const current: AttendanceRecord = { ...master };

            // Historical versions (mapped back to AttendanceRecord shape for compatibility)
            const historical = master.history.map((h, i) => ({
                id: `${master.id}-h-${i}`,
                date: master.date,
                dateRaw: h.submittedAt,
                serviceType: master.serviceType,
                adults: h.adults,
                kids: h.kids,
                babies: h.babies,
                total: h.adults + h.kids + h.babies,
                history: [] // Historical entries don't have their own history
            })).reverse(); // Newest history first (history is appended in API, so reverse to show newest first)

            return [current, ...historical];
        };

        return {
            dailyData,
            latestTotal,
            lastWeekTotal,
            weekOverWeekPercent,
            trendDirection,
            chartDataServices,
            chartDataBreakdown,
            filteredRecords,
            getServiceHistory,
        };
    }, [records]);

    return {
        records,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error as Error | null,
        refetch: query.refetch,
        ...derived,
    };
}

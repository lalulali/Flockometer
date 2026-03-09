# Dashboard Scroll Snapping Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Implement full-page vertical scroll snapping on the dashboard between Overview and History.

**Architecture:** Split the dashboard into two `section` tags using `snap-start`. The second section (History) will be redesigned to fill the viewport edge-to-edge.

**Tech Stack:** Next.js (Tailwind CSS 4), Lucide Icons.

---

### Task 1: Dashboard Scroll Snapping Layout

**Files:**
- Modify: `/Users/christianhadianto/Documents/TechSmith/Flockometer/.worktrees/task-1/src/app/dashboard/page.tsx`

**Step 1: Update Dashboard layout for snapping**

Apply `snap-y snap-mandatory` to the main container and wrap existing components into snap-aligned sections.

```tsx
"use client";

import { Loader2, AlertCircle, RefreshCw, ChevronDown } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import HeroCard from "@/components/dashboard/HeroCard";
import TrendsChart from "@/components/dashboard/TrendsChart";
import HistoryTable from "@/components/dashboard/HistoryTable";

export default function DashboardPage() {
  const {
    records,
    isLoading,
    isError,
    error,
    refetch,
    latestTotal,
    lastWeekTotal,
    weekOverWeekPercent,
    trendDirection,
    chartDataServices,
    chartDataBreakdown,
    filteredRecords,
  } = useDashboardData();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 text-[#0072BC] animate-spin" />
        <p className="text-sm font-semibold text-gray-400 animate-pulse">
          Loading Flock Stats...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-1">Failed to load data</h2>
          <p className="text-xs text-gray-400 font-medium">
            {error?.message || "Something went wrong."}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0072BC] text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar bg-gray-50/30">
      {/* SECTION 1: OVERVIEW */}
      <section className="snap-start snap-always h-full flex flex-col p-5 gap-4 shrink-0 transition-all">
        <div className="flex flex-col gap-0.5 pt-2">
          <h1 className="text-xl font-bold text-gray-800 tracking-tight">Dashboard</h1>
          <p className="text-[11px] text-gray-400 font-medium">
            Overview of your flock's growth
          </p>
        </div>

        <HeroCard
          latestTotal={latestTotal}
          lastWeekTotal={lastWeekTotal}
          weekOverWeekPercent={weekOverWeekPercent}
          trendDirection={trendDirection}
        />

        <TrendsChart
          chartDataServices={chartDataServices}
          chartDataBreakdown={chartDataBreakdown}
        />

        {/* Scroll Hint */}
        <div className="flex-1 flex flex-col items-center justify-end pb-4 opacity-30">
           <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">History</span>
           <ChevronDown className="w-4 h-4 text-gray-400 animate-bounce" />
        </div>
      </section>

      {/* SECTION 2: HISTORY */}
      <section className="snap-start snap-always h-full flex flex-col shrink-0">
        <HistoryTable
          records={records}
          filteredRecords={filteredRecords}
        />
      </section>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat(dashboard): implement full-page vertical scroll snapping"
```

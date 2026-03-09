# KINETIC WEAVE: FLOCKOMETER CORE FEATURES (v1.0.0)

[STATUS: ACTIVE]
[RELATION: context.md]

## 1. FEATURE: THE INTERACTIVE COUNTER (Page 1)

### ## FEATURE OBJECTIVE:

Provide a zero-friction, mobile-optimized interface for volunteers to track attendance across three categories (Adult, Kids, Baby) for two distinct service types, with safety interlocks for data integrity.

### ## CONTEXT & SCOPE:

* `src/app/counter/page.tsx` (Main View)
* `src/components/counter/CounterLogic.tsx` (State & Undo Management)
* `src/components/ui/SummaryModal.tsx` (Validation Layer)
* `src/components/ui/ConfirmationModal.tsx` (Safety Layer)

### ## EXECUTION LOGIC:

1. **Service Toggle:** Create a high-contrast segmented control at the top to switch between "Main Service" and "Kids Service".
2. **State Management:** Use a React Reducer or Context to track:
   * `mainService: { adults: 0, kids: 0, babies: 0 }`
   * `kidsService: { adults: 0, kids: 0, babies: 0 }`
   * `historyStack: []` (Capture state before each increment for "Undo" functionality).
3. **Horizontal Input Bar (Bottom):** - Fixed at the bottom of the viewport.
   * Three large, tappable segments: [ + ADULT ] [ + KIDS ] [ + BABY ].
   * Visual Feedback: Subtle haptic-style scale animation on tap.
4. **Safety Flows:**
   * **Undo:** Revert to the previous state in the `historyStack`.
   * **Clear:** Trigger `ConfirmationModal` before zeroing out all current session data.
   * **Submit:** Trigger `SummaryModal` showing a combined view of both Main and Kids service totals.
5. **Airtable Integration:** Upon confirmation in Summary Modal, trigger `POST /api/submit` with the dual-row package.

## 2. FEATURE: INTELLIGENT DASHBOARD (Page 2)

### ## FEATURE OBJECTIVE:

Visualise church growth trends and provide a searchable, exportable historical record with an ergonomic "scroll-to-focus" interface.

### ## CONTEXT & SCOPE:

* `src/app/dashboard/page.tsx`
* `src/components/dashboard/TrendsChart.tsx` (Recharts implementation)
* `src/components/dashboard/HistoryTable.tsx` (List view)
* `src/lib/exportExcel.ts` (Utilizing `xlsx`)

### ## EXECUTION LOGIC:

1. **"At a Glance" Section:**
   * Display three KPI cards: Latest Total, 4-Week Trend (%), and Average Attendance.
   * Render a Line Chart showing the last 4-8 weeks of total attendance.
2. **"Historical Data" Scroll Interaction:**
   * Use `Intersection Observer` or `Framer Motion` scroll-linked values.
   * **Logic:** When the user begins scrolling into the Historical List, the "At a Glance" section should gracefully fade/translate out, allowing the list to occupy the full viewport for maximum readability.
3. **Filtering Engine:**
   * Implement a date-range picker.
   * Filter logic: Process Airtable records in-memory (per RULE 2 of Storage) to show specific date ranges.
4. **Excel Export:**
   * Anchor an "Export to Excel" button (IFGF Blue) at the top of the history section.
   * Logic: Map the currently filtered state to an Excel Worksheet and trigger an immediate download.

### ## INTEGRATION POINTS:

* **Global Identity:** All buttons must use `bg-[#0072BC]` (IFGF Blue) and `rounded-2xl`.
* **Navigation:** Implement the Floating Island Navbar across both pages to allow seamless switching.

### ## VERIFICATION:

* [ ] Confirm "Undo" reverts exactly 1 step without affecting the other service type.
* [ ] Verify that "Clear" does not wipe data without the confirmation modal.
* [ ] Test Excel Download on mobile (ensure file naming follows `IFGF_Attendance_YYYY-MM-DD.xlsx`).
* [ ] Ensure the Airtable "Upsert" correctly overwrites records when the same date is submitted twice.

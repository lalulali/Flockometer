# Flockometer Design Document
**Version:** 1.0.0  
**Date:** 2026-03-09  
**Status:** Approved  

---

## 1. Project Overview

**Flockometer** is a mobile-first Progressive Web App (PWA) for IFGF church volunteers to track attendance across two service types and three age categories, then submit to Airtable. A dashboard provides at-a-glance trends and exportable historical records.

### Tech Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS (mobile-first, 375px baseline) |
| Backend/DB | Airtable (via Personal Access Token, server-side) |
| Charts | Recharts (AreaChart / LineChart, mobile-optimized) |
| Export | `xlsx` library (client-side) |
| State | React Context + Reducer (counter) + React Query (dashboard) |
| PWA | `@ducanh2912/next-pwa` |
| Icons | Lucide React |

### Brand Identity
- **Primary:** `#0072BC` (IFGF Blue)
- **Destructive:** `#EF4444` (Soft Red)
- **Success/Kids:** `#10B981` (Green)
- **Babies:** `#F59E0B` (Amber)
- **Background:** `#F3F4F6`
- **Radius:** `rounded-2xl` throughout
- **Typography:** Inter (sans-serif)

---

## 2. Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout + PIN gate wrapper
│   ├── page.tsx                # Redirect → /counter
│   ├── counter/
│   │   └── page.tsx            # Counter page shell
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard page shell
│   └── api/
│       ├── submit/route.ts     # POST: upsert to Airtable (dual-row)
│       └── records/route.ts    # GET: fetch all records (paginated)
├── components/
│   ├── counter/
│   │   ├── ServiceToggle.tsx   # Main/Kids segmented control
│   │   ├── CounterDisplay.tsx  # Shows current tallies (3 cards)
│   │   ├── CounterInputBar.tsx # + buttons (KID, BABY, ADULT)
│   │   ├── CounterDecrBar.tsx  # — buttons (per category)
│   │   └── CounterActions.tsx  # Undo / Reset controls
│   ├── dashboard/
│   │   ├── AttendanceHero.tsx  # Hero card: total + vs last week
│   │   ├── TrendsChart.tsx     # Line chart w/ Services/Breakdown toggle
│   │   ├── HistoryTable.tsx    # Scrollable list + date filter
│   │   └── ExportButton.tsx    # xlsx download trigger
│   ├── ui/
│   │   ├── SummaryModal.tsx    # Pre-submit: both services + grand total
│   │   ├── ConfirmationModal.tsx # Reset safety interlock
│   │   ├── PinGate.tsx         # PIN entry screen
│   │   └── FloatingNavbar.tsx  # Bottom island nav (Counter ↔ Dashboard)
│   └── providers/
│       └── QueryProvider.tsx   # React Query client wrapper
├── hooks/
│   ├── useCounterState.ts      # Reducer + per-tab undo stacks + localStorage
│   └── useDashboardData.ts     # React Query fetch + in-memory filter + KPI calculations
└── lib/
    ├── airtable.ts             # Airtable SDK wrapper (server-side only)
    └── exportExcel.ts          # xlsx sheet generation
```

---

## 3. Data Structure

### 3.1 Airtable Schema (`Attendance` table)

| Field | Type | Notes |
|---|---|---|
| `ID` | Formula | `CONCATENATE({Date}, "-", {ServiceType})` — composite PK |
| `Date` | Date | ISO `YYYY-MM-DD`, stored in GMT |
| `ServiceType` | Single Select | `"Main Service"` \| `"Kids Service"` |
| `Adults` | Number | |
| `Kids` | Number | |
| `Babies` | Number | |
| `Total` | Formula | `{Adults} + {Kids} + {Babies}` |
| `SubmittedAt` | Last Modified Time | Auto-updated on every upsert |
| `History` | Long Text | JSON array of prior submission snapshots |

**History field format** (appended on re-submission):
```json
[
  { "adults": 100, "kids": 30, "babies": 5, "submittedAt": "2026-03-09T10:00:00Z" }
]
```

**Upsert flow in `POST /api/submit`:**
1. Fetch existing record by `ID`
2. If found → parse `History`, push current values as new snapshot → PATCH with new counts + updated History
3. If not found → CREATE with `History: []`
4. Each POST sends **two rows**: one for Main Service, one for Kids Service

### 3.2 LocalStorage Draft Schema

```json
// key: "flockometer_draft"
{
  "date": "2026-03-09",
  "mainService": { "adults": 42, "kids": 18, "babies": 3 },
  "kidsService": { "adults": 5, "kids": 20, "babies": 8 }
}
```

**Draft lifecycle:**
- **Hydrated on mount** — `useCounterState` reads from `localStorage` on init via `HYDRATE` action
- **Written on every tap** — debounced 300ms write after each count change
- **Date-aware** — if stored `date` ≠ today (GMT), draft is auto-discarded and reset to zero
- **Cleared on successful submission** — after Airtable confirms the POST

---

## 4. Authentication

- **Mechanism:** Single PIN, case-sensitive, validated client-side
- **ENV variable:** `ACCESS_PIN=IFGFSG`
- **Session:** On success, `flockometer_authed=true` stored in `sessionStorage` (expires on tab close)
- **Gate location:** Root `layout.tsx` — all routes protected
- **Wrong PIN:** Shake animation + "Incorrect PIN" error message
- **UI:** IFGF-branded PIN entry screen with masked text input

---

## 5. PWA Configuration

- **Package:** `@ducanh2912/next-pwa`
- **Manifest:** `public/manifest.json`
  - `theme_color: "#0072BC"`
  - `background_color: "#F3F4F6"`
  - `display: "standalone"`
- **Service Worker caching:**
  - Counter page + static assets → **cache-first** (works offline)
  - `/api/submit` and `/api/records` → **network-only**
- **Offline UX:** Toast notification: *"No connection — your counts are saved locally. Try again when online."*

---

## 6. Counter Page

### Layout (mobile-first)

```
┌─────────────────────────────┐
│  🏛 FLOCKOMETER             │  ← header
│                             │
│  ┌─ TOTAL ATTENDANCE ─────┐ │
│  │         187            │ │  ← hero card (IFGF blue, active tab total)
│  └────────────────────────┘ │
│                             │
│  [ MAIN SERVICE | KIDS SVC] │  ← ServiceToggle (segmented control)
│                             │
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │  84  │ │  10  │ │   2  ││  ← CounterDisplay cards
│  │ADULTS│ │ KIDS │ │BABIES││
│  └──────┘ └──────┘ └──────┘│
│                             │
│  [↩ UNDO]      [↺ RESET]   │  ← CounterActions
│                             │
│  [  —  ]  [  —  ]  [  —  ] │  ← CounterDecrBar (decrement per category)
│                             │
│  [  +  ]  [  +  ]  [  +  ] │  ← CounterInputBar (increment)
│  [ADULT]  [ KIDS] [ BABY]  │
│                             │
├─────────────────────────────┤
│  [   ✅ SUBMIT TO AIRTABLE ]│  ← Submit (Variant A: sticky bar)
├─────────────────────────────┤
│       ⬤ Counter  📊        │  ← FloatingNavbar (FAB island)
└─────────────────────────────┘
```

### State Shape (`useCounterState`)

```typescript
type ServiceCounts = { adults: number; kids: number; babies: number }
type State = {
  activeTab: "main" | "kids"
  mainService: ServiceCounts
  kidsService: ServiceCounts
  mainHistory: ServiceCounts[]   // undo stack, max 10 entries
  kidsHistory: ServiceCounts[]   // undo stack, max 10 entries
  date: string                   // YYYY-MM-DD (GMT)
}
```

**Actions:** `TAP_ADULT | TAP_KIDS | TAP_BABY | DECR_ADULT | DECR_KIDS | DECR_BABY | UNDO | RESET | SWITCH_TAB | HYDRATE`

**Undo behaviour:**
- Scoped to the **active tab** only
- Pushes current tab counts onto that tab's history stack before mutating
- History stack capped at 10 entries (oldest dropped)

**Reset behaviour:**
- Triggers `ConfirmationModal` first
- On confirm: zeroes **active tab** counts AND clears that tab's history stack
- Other tab's data is unaffected

### Submit Variant Feature Flag

```env
# Variant A: sticky full-width bar above the FAB navbar
# Variant C: button embedded inside the hero card below the total
NEXT_PUBLIC_SUBMIT_BUTTON_POSITION=sticky-bar   # or: hero-card
```

### Summary Modal

Shown before submission. Displays read-only view of both tabs:

```
📋 Confirm Submission — Sunday, Mar 9 2026

Main Service
  Adults: 84  Kids: 10  Babies: 2  → Total: 96

Kids Service
  Adults: 5   Kids: 20  Babies: 8  → Total: 33

────────────────────────
  GRAND TOTAL: 129

[ Cancel ]          [ ✅ Submit ]
```

### Visual Design
- **Hero card:** `bg-[#0072BC]`, white text, `rounded-2xl`, `text-6xl font-bold` for the number
- **ServiceToggle:** Active = IFGF blue, inactive = gray, full-width, `rounded-2xl`
- **Count cards:** White, `rounded-2xl`, shadow — number in `text-4xl font-bold`
- **`+` buttons:** IFGF blue, `rounded-2xl`, 72px tall, `active:scale-95` tap animation
- **`—` buttons:** Light gray, `rounded-2xl`, smaller than `+` buttons
- **Undo:** Ghost blue button | **Reset:** Ghost red `#EF4444`

---

## 7. Dashboard Page

### Hero Card

```
┌──────────────────────────────────┐
│     TOTAL ATTENDANCE             │
│                                  │
│   266              ↑ +8.1%      │  ← combined this week + % badge (green/red)
│                                  │
│        VS. 246 LAST WEEK         │  ← previous Sunday's combined total
└──────────────────────────────────┘
```

**KPI calculations:**
| Metric | Logic |
|---|---|
| **This week total** | Sum of Adults + Kids + Babies across both services for most recent Sunday |
| **Last week total** | Same for the Sunday before |
| **% change** | `((thisWeek - lastWeek) / lastWeek) * 100` |
| **Badge colour** | Green for growth (`↑`), red for decline (`↓`), gray for no change |

### Trends Chart

```
Attendance Trends         [Services | Breakdown]
Last 8 Sundays
```

**Services view (default):**
- 2 lines: `● Main Service` (IFGF Blue) and `● Kids Service` (Green)
- Each line = sum of Adults + Kids + Babies for that service per Sunday

**Breakdown view:**
- 3 lines: `● Adults` (Blue) · `● Kids` (Green) · `● Babies` (Amber `#F59E0B`)
- Combined across both services per age category
- Y-axis auto-scales to `max(adults) × 1.1` — ensures Babies line is distinctly visible

**Shared chart config:**
- Chart type: Recharts `<LineChart>` 
- X-axis: Last 8 Sunday dates (abbreviated)
- Tooltip: Shows all values on hover (including Babies) in both views
- Smooth curves: `type="monotone"`

### Data Fetching (`useDashboardData`)

```
GET /api/records
  → Paginate Airtable (100 rows/page, follow offset token until exhausted)
  → Return all ~1k rows

React Query:
  staleTime: 5 minutes
  gcTime: 30 minutes

Default filter on load: last 4 weeks (applied in-memory)
```

**Filter state (in-memory, no re-fetch):**
- `dateFrom` / `dateTo` — date range picker
- Applied after full dataset is cached

### History Section

- Date range picker for filtering
- `📥 Export Excel` button (IFGF Blue) at top of section
- List rows: `Date · Service Type · Total` (tap to expand: Adults / Kids / Babies breakdown)
- **Scroll-to-focus:** When user scrolls into History, hero + chart fade out (`opacity-0`, translate up) via `Intersection Observer` — History expands to full viewport

### Excel Export

- Filename: `IFGF_Attendance_YYYY-MM-DD.xlsx` (today's date)
- Columns: `Date | Service Type | Adults | Kids | Babies | Total`
- Rows: **currently filtered view only**

---

## 8. Navigation

### Floating Island Navbar

- Component: `FloatingNavbar.tsx`
- Position: `fixed bottom-6 left-1/2 -translate-x-1/2`
- Style: `rounded-2xl bg-white/80 backdrop-blur-md shadow-lg`
- Tabs: Counter (home icon) ↔ Dashboard (chart icon)
- Active: IFGF Blue icon + label | Inactive: gray

---

## 9. Environment Variables

```env
# Airtable
AIRTABLE_PERSONAL_ACCESS_TOKEN=your_token_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_NAME=Attendance

# Auth
ACCESS_PIN=IFGFSG

# Feature Flags
NEXT_PUBLIC_SUBMIT_BUTTON_POSITION=sticky-bar   # or: hero-card
```

---

## 10. Verification Checklist

- [ ] Undo reverts exactly 1 step on active tab only, without affecting the other tab
- [ ] Reset requires confirmation modal before zeroing active tab, does not affect other tab
- [ ] LocalStorage draft restores correctly on page refresh and tab navigation
- [ ] Draft auto-discards if stored date ≠ today (GMT)
- [ ] Draft is cleared after successful Airtable submission
- [ ] Re-submitting same date appends previous values to Airtable `History` field
- [ ] Dashboard loads all ~1k rows via paginated fetch (no records skipped)
- [ ] Chart: Services view shows Main + Kids service totals
- [ ] Chart: Breakdown view shows Adults + Kids + Babies with Babies line visible
- [ ] Hero card % badge is green for growth, red for decline
- [ ] Excel export filename follows `IFGF_Attendance_YYYY-MM-DD.xlsx`
- [ ] Excel rows match currently filtered history view
- [ ] PIN gate blocks all routes until `ACCESS_PIN` is matched (case-sensitive)
- [ ] Wrong PIN triggers shake animation and error message
- [ ] Offline: counter page loads from service worker cache
- [ ] Offline: submission attempt shows toast, does not silently fail
- [ ] PWA installable on iOS and Android (manifest + service worker)
- [ ] No horizontal scroll at 375px viewport width
- [ ] Submit button variant switches correctly via `NEXT_PUBLIC_SUBMIT_BUTTON_POSITION`

# Flockometer Design Document

**Date:** 2026-03-09
**Status:** Approved
**Related:** `artifacts/product/context.md`, `artifacts/product/requirement.md`

---

## 1. Overview

Flockometer is a mobile-first PWA for IFGF church volunteers to count attendance across three categories (Adults, Kids, Babies) for two service types (Main Service, Kids Service), submit to Airtable, and view growth trends on a dashboard.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS (Mobile-First) |
| Backend/DB | Airtable Base (via Personal Access Token) |
| Icons | Lucide React |
| Charts | Recharts (mobile-optimized) |
| Export | xlsx library |
| State | React Context (counter) + React Query (dashboard) |
| PWA | @ducanh2912/next-pwa |
| Persistence | localStorage (draft counts) + sessionStorage (auth) |

---

## 3. Architecture: Feature-Sliced Components

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
│   │   ├── CounterDisplay.tsx  # Shows current tallies for active tab
│   │   ├── CounterInputBar.tsx # Fixed bottom bar [+ADULT][+KIDS][+BABY]
│   │   └── CounterActions.tsx  # Undo / Reset / Submit controls
│   ├── dashboard/
│   │   ├── HeroCard.tsx        # Total attendance + week-over-week
│   │   ├── TrendsChart.tsx     # Recharts line chart (dual view)
│   │   ├── HistoryTable.tsx    # Scrollable list + date filter
│   │   └── ExportButton.tsx    # xlsx download trigger
│   ├── ui/
│   │   ├── SummaryModal.tsx    # Pre-submit review: both services + grand total
│   │   ├── ConfirmationModal.tsx # Reset safety interlock
│   │   ├── PinGate.tsx         # PIN entry screen (sessionStorage)
│   │   └── FloatingNavbar.tsx  # Bottom island nav (Counter ↔ Dashboard)
│   └── providers/
│       └── QueryProvider.tsx   # React Query client wrapper
├── hooks/
│   ├── useCounterState.ts      # Reducer + per-tab undo stack
│   └── useDashboardData.ts     # React Query fetch + in-memory filter
└── lib/
    ├── airtable.ts             # Airtable SDK wrapper
    └── exportExcel.ts          # xlsx sheet generation
```

---

## 4. Data Structure

### 4.1 Airtable Schema

| Field | Type | Notes |
|---|---|---|
| ID | Formula | `CONCATENATE({Date}, "-", {ServiceType})` → composite PK |
| Date | Date | ISO `YYYY-MM-DD`, stored in GMT |
| ServiceType | Single Select | `"Main Service"` \| `"Kids Service"` |
| Adults | Number | |
| Kids | Number | |
| Babies | Number | |
| Total | Formula | `{Adults} + {Kids} + {Babies}` |
| SubmittedAt | Last Modified Time | Auto-updated on every upsert |
| History | Long Text | JSON array of prior snapshots |

**History field format** (appended on every re-submission):

```json
[
  {"adults": 100, "kids": 30, "babies": 5, "submittedAt": "2026-03-09T10:00:00Z"},
  {"adults": 105, "kids": 32, "babies": 5, "submittedAt": "2026-03-09T11:30:00Z"}
]
```

**Upsert flow in `POST /api/submit`:**

1. Look up existing record by ID (date + service type)
2. If found → parse existing History, push current values as a new snapshot, then PATCH with new counts + updated History
3. If not found → CREATE with empty `History: []`
4. Both Main and Kids Service rows are submitted in a single POST (dual-row package)

### 4.2 LocalStorage Draft Schema

```json
// key: "flockometer_draft"
{
  "date": "2026-03-09",
  "mainService": { "adults": 42, "kids": 18, "babies": 3 },
  "kidsService": { "adults": 5, "kids": 20, "babies": 8 }
}
```

**Draft lifecycle:**

- **Hydrated on mount** — `useCounterState` reads from localStorage on init
- **Written on every tap** — debounced 300ms write after each count change
- **Date-aware** — if stored `date` ≠ today (GMT), draft auto-discards and resets to zero
- **Cleared on successful submission** — after Airtable confirms the POST

---

## 5. Counter Page

### 5.1 Layout (mobile-first, 375px)

```
┌─────────────────────────────┐
│  🏛 FLOCKOMETER             │
│                             │
│  ┌── TOTAL ATTENDANCE ────┐ │
│  │        187             │ │  ← hero card (active tab total)
│  └────────────────────────┘ │
│                             │
│  [ MAIN SERVICE | KIDS SVC] │  ← ServiceToggle
│                             │
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │  42  │ │  16  │ │  84  ││  ← count cards
│  │ KIDS │ │BABIES│ │ADULTS││
│  └──────┘ └──────┘ └──────┘│
│                             │
│  [↩ UNDO]      [↺ RESET]   │
│                             │
│  [  —  ]  [  —  ]  [  —  ] │  ← decrement buttons
│                             │
│  [  +  ]  [  +  ]  [  +  ] │  ← increment buttons (large, blue)
│  [ KID ]  [ BABY] [ADULT]  │
│                             │
├─────────────────────────────┤
│  [ ✅ SUBMIT ] (Variant A)  │  ← sticky bar OR hero card CTA (Variant C)
├─────────────────────────────┤
│       ⬤ Counter  📊 Dash   │  ← FAB island navbar
└─────────────────────────────┘
```

### 5.2 Submit Button A/B Test (Feature Flag)

```env
NEXT_PUBLIC_SUBMIT_BUTTON_POSITION=sticky-bar   # or: hero-card
```

| Variant | Behavior |
|---|---|
| `sticky-bar` | Full-width blue submit bar between increment row and FAB nav |
| `hero-card` | Submit CTA rendered inside the hero card, below the total number |

### 5.3 State Shape (`useCounterState`)

```typescript
type ServiceCounts = { adults: number; kids: number; babies: number }
type State = {
  activeTab: "main" | "kids"
  mainService: ServiceCounts
  kidsService: ServiceCounts
  mainHistory: ServiceCounts[]   // undo stack, max 10
  kidsHistory: ServiceCounts[]   // undo stack, max 10
  date: string                   // YYYY-MM-DD (GMT)
}
```

**Actions:** `TAP_ADULT | TAP_KIDS | TAP_BABY | DEC_ADULT | DEC_KIDS | DEC_BABY | UNDO | CLEAR | SWITCH_TAB | HYDRATE`

- Undo is **per-tab** — each service type has its own independent 10-step history stack
- Undo pushes the current tab's counts onto that tab's history before mutating
- Reset triggers `ConfirmationModal` first, then resets the **active tab's** counts + its history stack

### 5.4 Summary Modal (pre-submit)

```
┌─────────────────────────────┐
│  📋 Confirm Submission      │
│  Sunday, Mar 9 2026         │
│                             │
│  Main Service               │
│  Adults: 142 · Kids: 38 · Babies: 7  │
│  Subtotal: 187              │
│                             │
│  Kids Service               │
│  Adults: 5 · Kids: 62 · Babies: 12   │
│  Subtotal: 79               │
│                             │
│  ═══════════════════════     │
│  GRAND TOTAL: 266            │
│                             │
│  [ Cancel ]  [ ✅ Submit ]  │
└─────────────────────────────┘
```

### 5.5 Visual Design

| Element | Style |
|---|---|
| ServiceToggle | Active = `bg-[#0072BC]` white text, Inactive = gray, `rounded-2xl` |
| CounterDisplay | Numbers `text-5xl font-bold`, labels muted gray |
| Increment buttons | `bg-[#0072BC]`, white text, `text-xl`, height 72px, `active:scale-95` |
| Decrement buttons | Ghost outline style, same grid as increment row |
| Undo | Ghost blue button |
| Reset | Ghost red `#EF4444` button |

---

## 6. Dashboard Page

### 6.1 Layout (mobile-first, 375px)

```
┌─────────────────────────────┐
│  📊 DASHBOARD               │
│                             │
│  ┌── TOTAL ATTENDANCE ────┐ │
│  │  266        ↑ +8.1%   │ │  ← hero card (blue gradient)
│  │  VS. 246 LAST WEEK    │ │
│  └───────────────────────┘ │
│                             │
│  ┌── Attendance Trends ───┐ │
│  │  [Services|Breakdown]  │ │  ← toggle pill
│  │  Last 8 Sundays        │ │
│  │  [Line chart ↑]        │ │
│  └───────────────────────┘ │
│                             │
│  ┌── HISTORY ─────────────┐ │
│  │ [Date Range Filter]    │ │
│  │ [📥 Export Excel]      │ │
│  │ Mar 2 · Main  · 187    │ │
│  │ Mar 2 · Kids  ·  79    │ │
│  │ Feb 23 · Main · 201    │ │
│  └───────────────────────┘ │
│                             │
├─────────────────────────────┤
│       ⬤ Counter  📊 Dash   │  ← FAB island navbar
└─────────────────────────────┘
```

### 6.2 Hero Card: Week-over-Week Comparison

- **Primary number:** this week's combined total (Main + Kids Service totals)
- **% badge:** green `↑` for growth, red `↓` for decline, gray for no change
- **VS. line:** previous Sunday's combined total
- **If no previous data:** shows `"First week!"` gracefully

### 6.3 Trends Chart (Dual View Toggle)

| View | Series | Colors |
|---|---|---|
| **Services** (default) | Main Service total, Kids Service total | Blue `#0072BC`, Green `#10B981` |
| **Breakdown** | Adults, Kids, Babies (combined across both services) | Blue `#0072BC`, Green `#10B981`, Amber `#F59E0B` |

- Chart type: `<LineChart>` (both views) — ensures trend visibility
- Y-axis: Auto-scaled (0 → max + 10%) — Babies line stays readable
- X-axis: Last 8 Sundays (abbreviated: "Jan 19", "Feb 2")
- Tooltip: Shows all values on hover including Babies

### 6.4 Scroll-to-Focus Behavior

- Scroll down past chart → KPI + chart fade `opacity-0`, translate up → History fills screen
- Scroll back up → KPI + chart fade back in
- Implemented via `Intersection Observer` + CSS transitions (no Framer Motion)

### 6.5 Data Fetching (`useDashboardData`)

```
GET /api/records
  → paginate Airtable (100 rows/page, offset token) until all ~1k rows fetched
  → return all rows

React Query config:
  staleTime: 5 minutes
  gcTime: 30 minutes
  Default filter: last 4 weeks (applied in-memory)
```

### 6.6 KPI Calculations (client-side)

| KPI | Logic |
|---|---|
| Latest Total | Sum of both services for most recent date |
| Week-over-Week % | `((thisWeek - lastWeek) / lastWeek) * 100` |
| Comparison | Show actual previous Sunday total |

### 6.7 History Table

- Filterable by date range (date picker)
- Each row: Date · Service Type · Adults · Kids · Babies · Total
- Sorted by date descending

### 6.8 Excel Export

- File name: `IFGF_Attendance_YYYY-MM-DD.xlsx` (today's date)
- Columns: Date, Service Type, Adults, Kids, Babies, Total
- Rows: mirrors currently filtered view only

---

## 7. Authentication: PIN Gate

### Flow

1. User visits any page → `PinGate` component checks `sessionStorage` for `flockometer_authed`
2. If absent → renders full-screen PIN entry
3. User enters PIN → compared client-side against `ACCESS_PIN` env var
4. Match → set `flockometer_authed=true` in `sessionStorage`, render app
5. Wrong → shake animation + "Incorrect PIN" error
6. Session expires when browser tab closes (sessionStorage behavior)

### ENV Variables

```env
ACCESS_PIN=IFGFSG
```

PIN is **case-sensitive**.

---

## 8. Floating Island Navbar

- Semi-transparent `bg-white/80 backdrop-blur-md`
- `rounded-2xl`, subtle shadow
- Fixed position: `bottom-6 left-1/2 -translate-x-1/2`
- Two tabs: Counter (🏠), Dashboard (📊)
- Active tab: IFGF Blue icon + label
- Inactive: gray

---

## 9. PWA Configuration

| Property | Value |
|---|---|
| Package | `@ducanh2912/next-pwa` |
| Display | `standalone` |
| Theme color | `#0072BC` |
| Background color | `#F3F4F6` |
| Scope | `/` |

### Caching Strategy

| Route | Strategy |
|---|---|
| Counter page + assets | Cached for offline use |
| API routes (`/api/*`) | Network-only (require connectivity) |

### Offline UX

If submission is attempted offline → toast: *"No connection — your counts are saved locally. Try again when online."*

---

## 10. Brand Identity

| Token | Value |
|---|---|
| Primary | `#0072BC` (IFGF Blue) |
| Secondary | `#F3F4F6` (Light Gray) |
| Accent/Destructive | `#EF4444` (Soft Red) |
| Chart Green | `#10B981` |
| Chart Amber | `#F59E0B` |
| Typography | Inter / system-default sans-serif |
| Border Radius | `rounded-2xl` globally |
| Min Width | 375px (iPhone SE/Mini) |

---

## 11. Environment Variables

```env
# Airtable
AIRTABLE_PAT=<personal access token>
AIRTABLE_BASE_ID=<base id>
AIRTABLE_TABLE_NAME=Attendance

# Authentication
ACCESS_PIN=IFGFSG

# Feature Flags
NEXT_PUBLIC_SUBMIT_BUTTON_POSITION=sticky-bar  # or: hero-card
```

# Flockometer Design Document
**Project:** IFGF Attendance Counter (v1.0.0 — Kinetic Weave)
**Date:** 2026-03-09
**Status:** APPROVED

---

## 1. Overview

Flockometer is a mobile-first PWA built with Next.js 15 (App Router) for IFGF church volunteers to:
1. **Count attendance** across three age categories (Adults, Kids, Babies) for two service types (Main Service, Kids Service), then submit to Airtable.
2. **View a dashboard** with at-a-glance KPIs, trend charts, historical records, date filtering, and Excel export.

**Key constraints:**
- Responsive at 375px width (iPhone SE/Mini) — no horizontal scroll
- IFGF Blue `#0072BC` as primary color
- PWA — installable, counter works offline, submission requires connectivity
- Text passphrase gate (`IFGFSG`, case-sensitive)

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS (Mobile-First) |
| Backend/DB | Airtable (via Personal Access Token) |
| Icons | Lucide React |
| Charts | Recharts (AreaChart / LineChart) |
| Export | `xlsx` library |
| State | React Context + Reducer (counter) + React Query (dashboard) |
| PWA | `@ducanh2912/next-pwa` |
| Auth | ENV passphrase + `sessionStorage` |

---

## 3. Architecture — Feature-Sliced Components

```
src/
├── app/
│   ├── layout.tsx              # Root layout — PIN gate wrapper
│   ├── page.tsx                # Redirect → /counter
│   ├── counter/
│   │   └── page.tsx            # Counter page shell
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard page shell
│   └── api/
│       ├── submit/route.ts     # POST: upsert both service rows to Airtable
│       └── records/route.ts    # GET: fetch all records (paginated)
├── components/
│   ├── counter/
│   │   ├── ServiceToggle.tsx   # Main/Kids segmented control
│   │   ├── CounterDisplay.tsx  # Category count cards (Adults, Kids, Babies)
│   │   ├── CounterInputBar.tsx # Large + increment buttons
│   │   └── CounterActions.tsx  # Undo / Reset controls
│   ├── dashboard/
│   │   ├── HeroCard.tsx        # Total Attendance + WoW comparison
│   │   ├── TrendsChart.tsx     # Dual-view line chart (Services / Breakdown)
│   │   ├── HistoryTable.tsx    # Filterable list + Export button
│   │   └── ExportButton.tsx    # xlsx download trigger
│   ├── ui/
│   │   ├── SummaryModal.tsx    # Pre-submit review (both services + grand total)
│   │   ├── ConfirmationModal.tsx # Reset safety interlock
│   │   ├── PinGate.tsx         # Passphrase entry screen
│   │   └── FloatingNavbar.tsx  # Bottom island nav (Counter ↔ Dashboard)
│   └── providers/
│       └── QueryProvider.tsx   # React Query client wrapper
├── hooks/
│   ├── useCounterState.ts      # Reducer + per-tab undo stacks + localStorage sync
│   └── useDashboardData.ts     # React Query fetch + in-memory filter helpers
└── lib/
    ├── airtable.ts             # Airtable SDK wrapper (server-side only)
    └── exportExcel.ts          # xlsx sheet generation
```

---

## 4. Data Structure

### 4.1 Airtable Schema (`Attendance` table)

| Field | Type | Notes |
|---|---|---|
| `ID` | Formula | `CONCATENATE({Date}, "-", {ServiceType})` — composite PK |
| `Date` | Date | ISO `YYYY-MM-DD`, stored in GMT |
| `ServiceType` | Single Select | `"Main Service"` \| `"Kids Service"` |
| `Adults` | Number | |
| `Kids` | Number | |
| `Babies` | Number | |
| `Total` | Formula | `{Adults} + {Kids} + {Babies}` |
| `SubmittedAt` | Last Modified Time | Auto-updated on every write |
| `History` | Long Text | JSON array of prior submission snapshots |

### 4.2 History Field Format

Appended on every re-submission (upsert) as a submission audit log:
```json
[
  { "adults": 100, "kids": 30, "babies": 5, "submittedAt": "2026-03-09T10:00:00Z" },
  { "adults": 105, "kids": 32, "babies": 5, "submittedAt": "2026-03-09T11:30:00Z" }
]
```

### 4.3 Upsert Flow (`POST /api/submit`)

Receives both service rows in a single request:
```json
{
  "date": "2026-03-09",
  "mainService": { "adults": 142, "kids": 38, "babies": 7 },
  "kidsService": { "adults": 5,   "kids": 62, "babies": 12 }
}
```

For each service row:
1. Look up existing Airtable record by `ID` (`date-serviceType`)
2. **If found:** Parse existing `History`, push current values as snapshot, PATCH with new counts + updated History
3. **If not found:** CREATE new record with `History: []`

### 4.4 LocalStorage Draft Schema

Counter state persists across navigation and browser refreshes:
```json
// key: "flockometer_draft"
{
  "date": "2026-03-09",
  "mainService": { "adults": 42, "kids": 18, "babies": 3 },
  "kidsService": { "adults": 5,  "kids": 20, "babies": 8 }
}
```

**Draft lifecycle:**
- **Hydrated on mount** — `useCounterState` reads localStorage on init
- **Written on every tap** — debounced 300ms write after each count change  
- **Date-aware** — if stored `date` ≠ today (GMT), draft is auto-discarded and reset to zero
- **Cleared on successful submission** — after Airtable confirms the POST

---

## 5. Authentication (PIN Gate)

- **Passphrase:** `IFGFSG` (case-sensitive, text input — not numeric)
- **Stored in:** `ACCESS_PIN` environment variable (server-side)
- **Verified via:** API route `POST /api/auth` (keeps PIN off the client bundle)
- **Session stored in:** `sessionStorage` key `flockometer_authed=true`
- **Session scope:** Expires when browser tab closes
- **Gate location:** Root `layout.tsx` — all routes protected
- **Wrong PIN UX:** Shake animation + "Incorrect passphrase" error message

---

## 6. PWA Configuration

- **Package:** `@ducanh2912/next-pwa`
- **Manifest:** `public/manifest.json`
  - `theme_color: "#0072BC"`
  - `background_color: "#F3F4F6"`
  - `display: "standalone"`
- **Service Worker caching:**
  - Counter page + static assets → **Cache First** (offline capable)
  - `/api/submit`, `/api/records`, `/api/auth` → **Network Only**
- **Offline UX:** Toast notification: *"No connection — your counts are saved locally. Try again when online."*

---

## 7. Counter Page Design

### 7.1 Layout

```
┌─────────────────────────────┐
│  🏛 FLOCKOMETER             │  ← app header
│                             │
│  ┌─ TOTAL ATTENDANCE ──── ┐ │
│  │  187        [Submit →] │ │  ← hero card (Variant C) OR
│  └────────────────────────┘ │    sticky bar below (Variant A)
│                             │
│  [ MAIN SERVICE | KIDS SVC] │  ← ServiceToggle
│                             │
│  ┌──────┐ ┌──────┐ ┌──────┐│
│  │  42  │ │  16  │ │  84  ││  ← CounterDisplay cards
│  │ KIDS │ │BABIES│ │ADULTS││
│  └──────┘ └──────┘ └──────┘│
│                             │
│  [↩ UNDO]      [↺ RESET]   │  ← CounterActions
│                             │
│  [  —  ]  [  —  ]  [  —  ] │  ← decrement buttons (per category)
│                             │
│  [  +  ]  [  +  ]  [  +  ] │  ← CounterInputBar (large, blue)
│  [ KID ]  [ BABY] [ADULT]  │
│                             │
│  [══ SUBMIT TO AIRTABLE ══] │  ← Variant A: sticky full-width bar
├─────────────────────────────┤
│       ⬤ Counter  📊        │  ← FloatingNavbar
└─────────────────────────────┘
```

### 7.2 Submit Button A/B Variants

Controlled by `.env`:
```env
NEXT_PUBLIC_SUBMIT_BUTTON_POSITION=sticky-bar   # or: hero-card
```

| Value | Behaviour |
|---|---|
| `sticky-bar` | Full-width IFGF Blue button pinned above the FloatingNavbar |
| `hero-card` | Submit CTA rendered inside the hero card below the total number |

### 7.3 State Shape (`useCounterState`)

```typescript
type ServiceCounts = { adults: number; kids: number; babies: number }
type CounterState = {
  activeTab: "main" | "kids"
  mainService: ServiceCounts
  kidsService: ServiceCounts
  mainHistory: ServiceCounts[]   // per-tab undo stack, max 10
  kidsHistory: ServiceCounts[]   // per-tab undo stack, max 10
  date: string                   // YYYY-MM-DD (GMT)
}
```

**Actions:** `TAP_ADULT | TAP_KIDS | TAP_BABY | DECREMENT_ADULT | DECREMENT_KIDS | DECREMENT_BABY | UNDO | RESET | SWITCH_TAB | HYDRATE`

**Undo scope:** Per active tab only — undoing on Main Service does not affect Kids Service stack.

**Reset scope:** Clears **both** tabs' counts and **both** history stacks (after `ConfirmationModal` confirmation).

**Minimum value:** 0 for all categories (decrement buttons disabled at 0).

### 7.4 Summary Modal (pre-submit)

Displays combined read-only view of both services + grand total:

```
┌─────────────────────────────┐
│  📋 Confirm Submission      │
│  Sunday, Mar 9 2026         │
│                             │
│  Main Service               │
│  Adults 142 · Kids 38 · Babies 7 │
│  Subtotal: 187              │
│                             │
│  Kids Service               │
│  Adults 5 · Kids 62 · Babies 12  │
│  Subtotal: 79               │
│                             │
│  ─────────────────────────  │
│  GRAND TOTAL: 266           │
│                             │
│  [ Cancel ]  [ ✅ Submit ]  │
└─────────────────────────────┘
```

### 7.5 Visual Design

| Element | Spec |
|---|---|
| ServiceToggle | Active: `bg-[#0072BC]` white text; Inactive: gray; `rounded-2xl` full-width |
| Hero card | IFGF Blue background, white text, `rounded-2xl` |
| Count cards | White background, number `text-4xl font-bold`, label muted gray |
| `+` buttons | `bg-[#0072BC]` white, height `72px`, `rounded-2xl`, `active:scale-95` |
| `—` buttons | Light gray, smaller than `+` buttons |
| Undo | Ghost blue button |
| Reset | Ghost `#EF4444` (soft red) |

---

## 8. Dashboard Page Design

### 8.1 Hero Card ("At a Glance")

```
┌────────────────────────────────┐
│       TOTAL ATTENDANCE         │
│   266          ↑ +8.1%        │
│       VS. 246 LAST WEEK        │
└────────────────────────────────┘
```

- **Total** = combined both service types for most recent Sunday in data
- **% badge** = `((thisWeek - lastWeek) / lastWeek) × 100` — green `↑`, red `↓`, gray if no prior data
- **"VS. X LAST WEEK"** = previous Sunday's combined total

### 8.2 Trends Chart (Toggle View)

**Toggle pill:** `[Services | Breakdown]`

| View | Lines | Legend |
|---|---|---|
| **Services** (default) | 2 lines: Main Service total, Kids Service total | `● Main Service  ● Kids Service` |
| **Breakdown** | 3 lines: Adults, Kids, Babies (combined across both services) | `● Adults  ● Kids  ● Babies` |

- **Chart type:** Recharts `LineChart` (both views)
- **Default range:** Last 8 Sundays
- **Y-axis:** Auto-scaled `0 → max × 1.1` — ensures Babies line is visible even at low values  
- **X-axis:** Sunday dates abbreviated (e.g., `Jan 19`, `Feb 2`)
- **Tooltip:** Shows all values on hover in both views (always includes Babies)
- **Colors:** Adults `#0072BC`, Kids Service / Kids `#10B981`, Main Service `#0072BC`, Babies `#F59E0B`

**Breakdown category calculations:**
- `Adults` = Main Service Adults + Kids Service Adults
- `Kids` = Main Service Kids + Kids Service Kids
- `Babies` = Main Service Babies + Kids Service Babies

### 8.3 History Section

- **Date range filter:** date-from / date-to picker
- **Service filter:** All / Main Service / Kids Service
- **Default filter on load:** Last 4 weeks
- **Excel export button:** IFGF Blue, top of history section
  - File name: `IFGF_Attendance_YYYY-MM-DD.xlsx` (today's date)
  - Columns: `Date, Service Type, Adults, Kids, Babies, Total`
  - Rows: mirrors currently filtered view

### 8.4 Scroll-to-Focus

- `IntersectionObserver` on the History section header
- Scrolling into History → Hero card + chart fade (`opacity-0`) and translate up
- Scrolling back up → Hero card + chart fade back in
- Pure CSS transitions, no Framer Motion dependency

### 8.5 Data Fetching (`useDashboardData`)

```
GET /api/records
  → paginate Airtable (100 rows/page, loop via offset token)
  → return all ~1,000 rows

React Query config:
  staleTime: 5 minutes
  gcTime: 30 minutes
  Default filter applied in-memory: last 4 weeks
```

All filtering (date range, service type) is performed client-side in-memory after the initial full fetch.

---

## 9. Navigation

### Floating Island Navbar

```
╭──────────────────────────────╮
│   🏠 Counter    📊 Dashboard │
╰──────────────────────────────╯
```

- `fixed bottom-6 left-1/2 -translate-x-1/2`
- `bg-white/80 backdrop-blur-md rounded-2xl shadow-lg`
- Active tab: IFGF Blue icon + label; Inactive: gray
- Submit sticky bar (Variant A) sits immediately above the navbar

---

## 10. Environment Variables

```env
# Airtable
AIRTABLE_PAT=your_personal_access_token
AIRTABLE_BASE_ID=your_base_id
AIRTABLE_TABLE_NAME=Attendance

# Auth
ACCESS_PIN=IFGFSG

# Feature Flags
NEXT_PUBLIC_SUBMIT_BUTTON_POSITION=sticky-bar   # or: hero-card
```

---

## 11. Verification Checklist

- [ ] Undo reverts exactly 1 step on the active tab without affecting the other tab
- [ ] Clear/Reset does not wipe data without the ConfirmationModal
- [ ] Draft persists in localStorage across tab switches and page refreshes
- [ ] Draft auto-discards if stored date ≠ today (GMT)
- [ ] Summary Modal shows both service subtotals + grand total (Adults + Kids + Babies)
- [ ] Airtable upsert correctly overwrites records and appends to History on re-submission
- [ ] Dashboard loads all ~1k rows via paginated fetch
- [ ] "Services" chart correctly shows Main Service total + Kids Service total
- [ ] "Breakdown" chart shows Adults / Kids / Babies with auto-scaled Y-axis (Babies visible)
- [ ] Tooltip in both chart views always includes Babies count
- [ ] Excel download works on mobile, filename: `IFGF_Attendance_YYYY-MM-DD.xlsx`
- [ ] PIN gate blocks all routes; `sessionStorage` clears on tab close
- [ ] Wrong PIN shows shake animation + error message
- [ ] Offline toast shown when submitting without connectivity
- [ ] PWA installable (manifest + service worker)
- [ ] No horizontal scroll at 375px viewport width

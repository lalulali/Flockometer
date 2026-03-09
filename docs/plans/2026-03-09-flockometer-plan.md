# Flockometer Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a mobile-first PWA attendance counter for IFGF church with Airtable backend and trend dashboard.

**Architecture:** Feature-sliced Next.js 15 App Router with React Context for counter state, React Query for dashboard data, localStorage for draft persistence, and sessionStorage for PIN auth. API routes proxy Airtable to keep PAT server-side.

**Tech Stack:** Next.js 15, Tailwind CSS, Recharts, xlsx, React Query, @ducanh2912/next-pwa, Lucide React

**Design Doc:** `docs/plans/2026-03-09-flockometer-design.md`

---

### Task 1: Project Scaffold & Dependencies

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `postcss.config.mjs`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Create: `.env.local`, `.env.example`, `.gitignore`

**Step 1: Initialize Next.js 15 project**

```bash
npx -y create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack
```

**Step 2: Install dependencies**

```bash
npm install recharts xlsx @tanstack/react-query lucide-react @ducanh2912/next-pwa
```

**Step 3: Create `.env.local`**

```env
# Airtable
AIRTABLE_PAT=placeholder
AIRTABLE_BASE_ID=placeholder
AIRTABLE_TABLE_NAME=Attendance

# Authentication
NEXT_PUBLIC_ACCESS_PIN=IFGFSG

# Feature Flags
NEXT_PUBLIC_SUBMIT_BUTTON_POSITION=sticky-bar
```

**Step 4: Create `.env.example`** (same as above but with `placeholder` for all secrets)

**Step 5: Add Inter font to `src/app/layout.tsx`**

Update the default layout to use Inter font from `next/font/google`. Set metadata title to "Flockometer" and description to "IFGF Attendance Counter".

**Step 6: Set up `src/app/globals.css`**

Keep Tailwind directives. Add IFGF brand CSS custom properties:

```css
:root {
  --ifgf-blue: #0072BC;
  --ifgf-gray: #F3F4F6;
  --ifgf-red: #EF4444;
  --chart-green: #10B981;
  --chart-amber: #F59E0B;
}
```

**Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: App runs on `http://localhost:3000` with no errors.

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 project with dependencies"
```

---

### Task 2: PIN Gate Authentication

**Files:**
- Create: `src/components/ui/PinGate.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create `PinGate.tsx`**

A client component (`'use client'`) that:
- Checks `sessionStorage.getItem('flockometer_authed')`
- If `'true'` → render `children`
- If absent → render full-screen PIN entry UI:
  - Centered card with FLOCKOMETER title + subtitle "IFGF Attendance Counter"
  - Text input (masked with `type="password"`)
  - "Enter" button (`bg-[#0072BC]`, `rounded-2xl`)
  - On submit: compare input to `process.env.NEXT_PUBLIC_ACCESS_PIN` (case-sensitive)
  - Match → `sessionStorage.setItem('flockometer_authed', 'true')`, re-render
  - Mismatch → shake animation (CSS `animate-shake`) + "Incorrect PIN" error text in red

**Step 2: Add shake keyframe to `globals.css`**

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}
.animate-shake { animation: shake 0.3s ease-in-out; }
```

**Step 3: Wrap root layout with PinGate**

In `src/app/layout.tsx`, wrap `{children}` with `<PinGate>{children}</PinGate>`.

**Step 4: Verify**

- Visit `http://localhost:3000` → see PIN screen
- Enter wrong PIN → shake + error
- Enter `IFGFSG` → app renders
- Refresh page → still authed (sessionStorage persists within tab)

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add PIN gate authentication with sessionStorage"
```

---

### Task 3: Floating Island Navbar

**Files:**
- Create: `src/components/ui/FloatingNavbar.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: Create `FloatingNavbar.tsx`**

A client component using `usePathname()` from `next/navigation`:
- Fixed positioned: `fixed bottom-6 left-1/2 -translate-x-1/2 z-50`
- Style: `bg-white/80 backdrop-blur-md rounded-2xl shadow-lg px-6 py-3`
- Two nav items using `<Link>`:
  - Counter: Home icon from Lucide + "Counter" label → `/counter`
  - Dashboard: BarChart3 icon from Lucide + "Dashboard" label → `/dashboard`
- Active tab: `text-[#0072BC] font-semibold`, Inactive: `text-gray-400`

**Step 2: Add navbar to layout.tsx** (inside PinGate, after `{children}`)

**Step 3: Create placeholder pages**

- `src/app/counter/page.tsx`: Returns `<div>Counter Page</div>`
- `src/app/dashboard/page.tsx`: Returns `<div>Dashboard Page</div>`
- `src/app/page.tsx`: Redirect to `/counter` using `redirect()` from `next/navigation`

**Step 4: Verify navigation works between both pages**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add floating island navbar with counter/dashboard routing"
```

---

### Task 4: Counter State Hook (`useCounterState`)

**Files:**
- Create: `src/hooks/useCounterState.ts`
- Create: `src/hooks/__tests__/useCounterState.test.ts`

**Step 1: Write failing tests**

Test cases:
- Initial state: all counts zero, activeTab "main", date is today GMT
- `TAP_ADULT` on main tab: mainService.adults increments, kidsService unchanged
- `TAP_KIDS`: mainService.kids increments
- `TAP_BABY`: mainService.babies increments
- `DEC_ADULT`: mainService.adults decrements (min 0, never goes negative)
- `UNDO` on main: reverts mainService to previous state, kidsService unchanged
- `UNDO` stack max 10: oldest entry removed when 11th tap happens
- `SWITCH_TAB`: toggles activeTab between "main" and "kids"
- `CLEAR`: resets active tab counts + history to zero
- `HYDRATE`: loads state from provided payload
- localStorage persistence: state written after each action (debounced)
- Date-aware: if stored date ≠ today, hydrate returns zero state

**Step 2: Run tests to verify they fail**

```bash
npx jest src/hooks/__tests__/useCounterState.test.ts
```

**Step 3: Implement `useCounterState.ts`**

- `useReducer` with actions listed above
- `useEffect` to hydrate from `localStorage.getItem('flockometer_draft')` on mount
- `useEffect` to debounce-write state to localStorage on every change (300ms)
- Date check: compare stored date against today (GMT `YYYY-MM-DD`)
- Export: `{ state, dispatch }` plus convenience functions `tap(category)`, `decrement(category)`, `undo()`, `clear()`, `switchTab()`

**Step 4: Run tests to verify they pass**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: implement useCounterState with per-tab undo and localStorage"
```

---

### Task 5: Counter Page UI Components

**Files:**
- Create: `src/components/counter/ServiceToggle.tsx`
- Create: `src/components/counter/CounterDisplay.tsx`
- Create: `src/components/counter/CounterInputBar.tsx`
- Create: `src/components/counter/CounterActions.tsx`
- Modify: `src/app/counter/page.tsx`

**Step 1: Create `ServiceToggle.tsx`**

- Two-segment pill: "MAIN SERVICE" | "KIDS SERVICE"
- Active: `bg-[#0072BC] text-white`, Inactive: `bg-gray-200 text-gray-500`
- `rounded-2xl`, full-width, `font-semibold uppercase text-sm`
- Props: `activeTab`, `onSwitch`

**Step 2: Create `CounterDisplay.tsx`**

- Hero card at top: blue gradient `bg-gradient-to-r from-[#0072BC] to-[#0095E8]`, `rounded-2xl`
  - "TOTAL ATTENDANCE" label
  - Large number: sum of active tab's adults + kids + babies, `text-6xl font-bold text-white`
  - If `NEXT_PUBLIC_SUBMIT_BUTTON_POSITION === 'hero-card'`, render submit button here
- Below hero: three count cards in a horizontal grid
  - Each card: `bg-white rounded-2xl shadow-sm p-4`, number `text-4xl font-bold`, label `text-xs text-gray-500 uppercase`
  - Order: KIDS | BABIES | ADULTS
- Props: `counts: ServiceCounts`, `onSubmit?`

**Step 3: Create `CounterActions.tsx`**

- Two ghost buttons side by side: "↩ UNDO" (blue) and "↺ RESET" (red)
- `rounded-2xl`, `border-2`, generous padding
- Props: `onUndo`, `onReset`, `canUndo: boolean`

**Step 4: Create `CounterInputBar.tsx`**

- Decrement row: three `—` buttons, ghost outline style, same 3-column grid
- Increment row: three large blue `+` buttons with labels (KID, BABY, ADULT)
  - `bg-[#0072BC] text-white rounded-2xl h-[72px]`, `active:scale-95 transition-transform`
- Props: `onIncrement(category)`, `onDecrement(category)`

**Step 5: Assemble `counter/page.tsx`**

- `'use client'` page
- Use `useCounterState()` hook
- Compose: CounterDisplay → ServiceToggle → CounterActions → CounterInputBar
- If `NEXT_PUBLIC_SUBMIT_BUTTON_POSITION === 'sticky-bar'`: render sticky submit bar before navbar
  - Full-width `bg-[#0072BC] text-white rounded-2xl py-4 font-semibold text-lg`
  - Fixed at bottom, above navbar (use `bottom-24` to clear navbar)
- Submit button opens SummaryModal (placeholder for now — just `console.log`)
- Add `pb-48` padding at bottom to clear both sticky submit + navbar

**Step 6: Verify visually on mobile viewport (375px)**

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: build counter page UI with service toggle and input bar"
```

---

### Task 6: Modals (Summary + Confirmation)

**Files:**
- Create: `src/components/ui/SummaryModal.tsx`
- Create: `src/components/ui/ConfirmationModal.tsx`
- Modify: `src/app/counter/page.tsx`

**Step 1: Create `ConfirmationModal.tsx`**

- Overlay modal: `fixed inset-0 bg-black/50 z-50 flex items-center justify-center`
- Card: white, `rounded-2xl p-6`, max-w-sm
- Title: "Reset Counts?"
- Body: "This will clear all counts for the active service tab."
- Two buttons: "Cancel" (ghost) + "Reset" (red `bg-[#EF4444]`)
- Props: `isOpen`, `onConfirm`, `onCancel`

**Step 2: Create `SummaryModal.tsx`**

- Same overlay structure as ConfirmationModal
- Title: "📋 Confirm Submission" + formatted date (e.g., "Sunday, Mar 9 2026")
- Two sections: Main Service + Kids Service, each showing Adults · Kids · Babies + Subtotal
- Divider + **GRAND TOTAL** (both subtotals combined), `text-2xl font-bold`
- Two buttons: "Cancel" (ghost) + "✅ Submit" (`bg-[#0072BC]`)
- Props: `isOpen`, `mainService`, `kidsService`, `date`, `onConfirm`, `onCancel`

**Step 3: Wire modals to counter page**

- Reset button → opens ConfirmationModal → on confirm calls `clear()`
- Submit button → opens SummaryModal → on confirm calls submit API (placeholder `console.log` for now)

**Step 4: Verify modal flows work**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add summary and confirmation modals"
```

---

### Task 7: Airtable API Routes

**Files:**
- Create: `src/lib/airtable.ts`
- Create: `src/app/api/submit/route.ts`
- Create: `src/app/api/records/route.ts`

**Step 1: Create `src/lib/airtable.ts`**

Helper functions:
- `getAirtableHeaders()`: returns `{ Authorization: 'Bearer ${PAT}', 'Content-Type': 'application/json' }`
- `getAirtableUrl()`: returns `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`
- `findRecordByFormula(formula: string)`: GET with `filterByFormula` param, return first match or null
- `createRecord(fields: object)`: POST to create
- `updateRecord(recordId: string, fields: object)`: PATCH to update

**Step 2: Create `POST /api/submit/route.ts`**

Request body:
```json
{
  "date": "2026-03-09",
  "mainService": { "adults": 142, "kids": 38, "babies": 7 },
  "kidsService": { "adults": 5, "kids": 62, "babies": 12 }
}
```

Logic (for each service type — Main and Kids):
1. Build ID: `${date}-${serviceType}`
2. Look up existing record via `filterByFormula: {ID} = "${id}"`
3. If found:
   - Parse existing `History` field (JSON string → array)
   - Push current record values `{adults, kids, babies, submittedAt: now()}` into array
   - PATCH record with new counts + updated History JSON string
4. If not found:
   - CREATE record with counts + empty History `"[]"`
5. Return `{ success: true }` or `{ error: message }` with appropriate status

**Step 3: Create `GET /api/records/route.ts`**

Logic:
1. Fetch all records from Airtable, paginating with `offset` token
2. Loop until no more offset
3. Map records to `{ id, date, serviceType, adults, kids, babies, total }`
4. Sort by date descending
5. Return JSON array

**Step 4: Test with curl** (requires valid Airtable credentials in `.env.local`)

```bash
# Test GET
curl http://localhost:3000/api/records

# Test POST
curl -X POST http://localhost:3000/api/records -H "Content-Type: application/json" \
  -d '{"date":"2026-03-09","mainService":{"adults":1,"kids":1,"babies":1},"kidsService":{"adults":1,"kids":1,"babies":1}}'
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Airtable API routes for submit (upsert) and records (paginated fetch)"
```

---

### Task 8: Wire Counter Submit to API

**Files:**
- Modify: `src/app/counter/page.tsx`
- Modify: `src/components/ui/SummaryModal.tsx`

**Step 1: Add submit handler in counter page**

- On SummaryModal confirm:
  - Set loading state
  - `fetch('/api/submit', { method: 'POST', body: JSON.stringify({ date, mainService, kidsService }) })`
  - On success: clear localStorage draft, reset state, show success toast
  - On error: show error toast
  - If offline (`!navigator.onLine`): show "No connection" toast, keep draft

**Step 2: Add loading state to SummaryModal submit button**

- While submitting: disable button, show spinner, text "Submitting..."

**Step 3: Create a simple toast component or use inline notification**

- Success: green bar at top "✅ Submitted successfully!"
- Error: red bar "❌ Failed to submit. Try again."
- Offline: amber bar "📡 No connection — saved locally."
- Auto-dismiss after 3 seconds

**Step 4: Verify end-to-end submit flow with Airtable**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: wire counter submission to Airtable API with toast feedback"
```

---

### Task 9: React Query Provider & Dashboard Data Hook

**Files:**
- Create: `src/components/providers/QueryProvider.tsx`
- Create: `src/hooks/useDashboardData.ts`
- Modify: `src/app/layout.tsx`

**Step 1: Create `QueryProvider.tsx`**

- Client component wrapping `QueryClientProvider` from `@tanstack/react-query`
- `QueryClient` with `defaultOptions.queries.staleTime: 5 * 60 * 1000` (5 min)

**Step 2: Wrap layout with QueryProvider** (inside PinGate)

**Step 3: Create `useDashboardData.ts`**

- `useQuery({ queryKey: ['records'], queryFn: () => fetch('/api/records').then(r => r.json()) })`
- Derived calculations (useMemo):
  - `latestTotal`: sum of both services for most recent date
  - `lastWeekTotal`: sum of both services for second most recent date
  - `weekOverWeekPercent`: `((latest - lastWeek) / lastWeek) * 100`
  - `trendDirection`: 'up' | 'down' | 'neutral'
  - `chartDataServices`: last 8 Sundays, each with mainTotal + kidsTotal
  - `chartDataBreakdown`: last 8 Sundays, each with combined adults + kids + babies
  - `filteredRecords(dateFrom, dateTo)`: in-memory filter function
- Export: `{ data, isLoading, latestTotal, lastWeekTotal, weekOverWeekPercent, trendDirection, chartDataServices, chartDataBreakdown, filteredRecords }`

**Step 4: Verify hook returns data when API is accessible**

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add React Query provider and dashboard data hook"
```

---

### Task 10: Dashboard Page UI

**Files:**
- Create: `src/components/dashboard/HeroCard.tsx`
- Create: `src/components/dashboard/TrendsChart.tsx`
- Create: `src/components/dashboard/HistoryTable.tsx`
- Create: `src/components/dashboard/ExportButton.tsx`
- Create: `src/lib/exportExcel.ts`
- Modify: `src/app/dashboard/page.tsx`

**Step 1: Create `HeroCard.tsx`**

- Blue gradient card (same as counter hero)
- "TOTAL ATTENDANCE" label
- Large number: `latestTotal`, `text-6xl font-bold text-white`
- Percentage badge: green pill for up, red for down, with arrow icon
- "VS. {lastWeekTotal} LAST WEEK" subtitle
- If no previous data: show "First week!" instead of comparison

**Step 2: Create `TrendsChart.tsx`**

- Toggle pill: `[Services | Breakdown]`, local state
- Recharts `<ResponsiveContainer>` → `<LineChart>`
- Services view: two `<Line>` — Main (blue #0072BC) + Kids (green #10B981)
- Breakdown view: three `<Line>` — Adults (blue) + Kids (green) + Babies (amber #F59E0B)
- X-axis: formatted Sunday dates
- Y-axis: auto-scaled, domain `[0, 'auto']`
- `<Tooltip>` showing all values
- Subtitle: "Last 8 Sundays"

**Step 3: Create `HistoryTable.tsx`**

- Date range filter: two `<input type="date">` (from/to), default last 4 weeks
- Table rows: Date · Service Type · Adults · Kids · Babies · Total
- Sorted by date descending
- Scroll-to-focus: use `Intersection Observer` on history section ref
  - When visible: add `opacity-0 -translate-y-8` class to hero + chart container
  - Transition: `transition-all duration-500 ease-in-out`

**Step 4: Create `ExportButton.tsx` + `src/lib/exportExcel.ts`**

- `exportExcel.ts`: function that takes filtered records array → creates xlsx Workbook → triggers download
  - Columns: Date, Service Type, Adults, Kids, Babies, Total
  - File name: `IFGF_Attendance_YYYY-MM-DD.xlsx`
- `ExportButton.tsx`: IFGF Blue button with Download icon, calls export function

**Step 5: Assemble `dashboard/page.tsx`**

- `'use client'` page
- Use `useDashboardData()` hook
- Compose: HeroCard → TrendsChart → HistoryTable (with ExportButton inside)
- Loading state: skeleton placeholders
- Add `pb-24` padding to clear navbar

**Step 6: Verify visually on mobile viewport (375px)**

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: build dashboard with hero card, trends chart, history table, and export"
```

---

### Task 11: PWA Configuration

**Files:**
- Create: `public/manifest.json`
- Create: `public/icons/icon-192x192.png`, `public/icons/icon-512x512.png`
- Modify: `next.config.ts`
- Modify: `src/app/layout.tsx`

**Step 1: Create `public/manifest.json`**

```json
{
  "name": "Flockometer",
  "short_name": "Flockometer",
  "description": "IFGF Attendance Counter",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0072BC",
  "background_color": "#F3F4F6",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Step 2: Generate PWA icons**

Use the generate_image tool to create a simple Flockometer icon (church/people counter theme, IFGF Blue `#0072BC` background) in both sizes.

**Step 3: Configure `next.config.ts`**

```typescript
import withPWA from '@ducanh2912/next-pwa';

const nextConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    { urlPattern: /^https:\/\/api\.airtable\.com/, handler: 'NetworkOnly' },
    { urlPattern: /\/api\//, handler: 'NetworkOnly' },
  ],
})({ /* next config */ });

export default nextConfig;
```

**Step 4: Add manifest link to `layout.tsx` metadata**

```typescript
export const metadata = {
  manifest: '/manifest.json',
  themeColor: '#0072BC',
};
```

**Step 5: Build and verify PWA installs**

```bash
npm run build && npm start
```

Visit in Chrome → verify install prompt appears.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: configure PWA with manifest, icons, and service worker"
```

---

### Task 12: Final Polish & Offline UX

**Files:**
- Modify: `src/app/counter/page.tsx` (offline detection)
- Modify: `src/app/globals.css` (animations)

**Step 1: Add offline detection to counter page**

- Listen to `window.addEventListener('online'/'offline')`
- If offline when submit attempted: show amber toast "No connection — your counts are saved locally. Try again when online."
- Optional: show a small offline indicator badge in header

**Step 2: Add tap animation to increment buttons**

```css
@keyframes tap-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(0.92); }
  100% { transform: scale(1); }
}
```

**Step 3: Add counter number transition**

- Animate number changes with a brief scale-up effect
- Use CSS `transition: transform 0.15s ease-out` on count cards

**Step 4: Responsive check**

- Verify all pages render correctly on 375px (iPhone SE)
- Verify no horizontal scrolling
- Verify navbar, submit bar, and modals don't overlap

**Step 5: Production build test**

```bash
npm run build
```

Expected: no build errors, no TypeScript errors.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add offline UX, tap animations, and final polish"
```

---

## Execution Order Summary

| Task | Description | Depends On |
|---|---|---|
| 1 | Project scaffold & dependencies | — |
| 2 | PIN gate authentication | 1 |
| 3 | Floating island navbar + routing | 1 |
| 4 | Counter state hook (useCounterState) | 1 |
| 5 | Counter page UI components | 3, 4 |
| 6 | Modals (Summary + Confirmation) | 5 |
| 7 | Airtable API routes | 1 |
| 8 | Wire counter submit to API | 6, 7 |
| 9 | React Query provider + dashboard hook | 7 |
| 10 | Dashboard page UI | 3, 9 |
| 11 | PWA configuration | 10 |
| 12 | Final polish & offline UX | 8, 11 |

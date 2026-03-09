# GLOBAL FLOCKOMETER: IFGF ATTENDANCE COUNTER (v1.0.0)

## 🧬 PROJECT DNA

* Environment: Antigravity (Context-Driven Development)
* Framework: Next.js 15 (App Router)
* Styling: Tailwind CSS (Mobile-First Priority)
* Backend/DB: Airtable Base (via Airtable Personal Access Token)
* Icons: Lucide React
* Charts: Recharts (optimized for mobile)
* Export: xlsx library for Excel generation
* State Management: React Context (for local counter state) + React Query (for dashboard fetching)

## 🎨 BRAND IDENTITY (IFGF)

* Primary Color: #0072BC (IFGF Blue - derived from logo)
* Secondary Color: #F3F4F6 (Light Gray Backgrounds)
* Accent: #EF4444 (Soft Red for destructive actions like Clear/Reset)
* Typography: Sans-serif (Inter or system-default)
* Design Language: Rounded corners (rounded-2xl), high-contrast buttons, and generous hit areas for mobile thumb-taps.

## 📁 THE SOURCE OF TRUTH (AIRTABLE SCHEMA)

The Airtable Base "IFGF_Attendance" must contain a table named Attendance with these fields:

1. ID (Formula: CONCATENATE({Date}, "-", {ServiceType})) -> Primary Key
1. Date (Date - ISO Format)
1. ServiceType (Single Select: "Main Service", "Kids Service")
1. Adults (Number)
1. Kids (Number)
1. Babies (Number)
1. Total (Number)
1. SubmittedAt (Created Time / GMT)

## 🛠 GLOBAL CONSTRAINTS & STANDARDS

* Responsive Mandate: UI must be perfectly usable on 375px width (iPhone SE/Mini size). No horizontal scrolling.
* Time Logic: Store all dates as YYYY-MM-DD in GMT. Convert to local browser time for UI display.
* API Strategy: - POST /api/submit: Receives a JSON package containing both Main and Kids service data.
  * Upsert Logic: Use the Airtable typecast: true and a lookup on the ID field to overwrite existing data for that specific Date/Service combination.
* Navigation: Floating Island Navbar (Bottom-Center). Semi-transparent background with backdrop-blur-md.

## 📦 BUFFERED FOR PHASE 2 (KINETIC WEAVE)

* Counter Logic: Horizontal bottom-bar layout, Undo stack (max 10 steps), Reset confirmation modal.
* Summary Layer: Full-screen modal overlay before the final Airtable POST.
* Dashboard Animation: Framer Motion for the "scroll-to-focus" effect on historical data.
* Excel Logic: Client-side generation of .xlsx based on the currently filtered view.
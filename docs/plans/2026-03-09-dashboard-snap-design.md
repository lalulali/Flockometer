# Design Doc: Dashboard Scroll Snap & Edge-to-Edge History

Implement a full-page scroll snap experience on the dashboard to improve focus on key metrics and provide a cleaner, more readable history view.

## 1. Objectives
- Improve focus on Overview metrics (Hero + Chart).
- Provide a dedicated, high-density History view.
- Enable smooth, guided navigation between these two views using CSS Scroll Snap.
- Implement efficient client-side pagination for historical records.

## 2. Views

### View 1: Overview
- **Composition**: Hero Card + Trends Chart.
- **Layout**: Centered or top-aligned within the viewport.
- **Constraints**: Must fit within `h-[calc(100dvh-navbarHeight)]`.

### View 2: History
- **Composition**: Redesigned `HistoryTable`.
- **Layout**: Edge-to-edge (no container padding, no rounded card borders).
- **Navigation**: Sticky filter header at the top.
- **Pagination**: Floating controls just above the navbar.

## 3. Technical Implementation

### Scroll Snap
- **Container**: The dashboard wrapper will use `snap-y snap-mandatory overflow-y-auto`.
- **Sections**: Two `section` elements with `snap-start h-full`.

### History Table Refresh
- Remove `bg-white border rounded-[2rem]` from the main container.
- Use a list-based edge-to-edge design.
- Implement local state for `currentPage` and `pageSize` (e.g., 12 items).
- Add a persistent Pagination component at the bottom of the section.

### Height Calculations
- Standardize the main container height to account for the sticky navbar and potential PWA safe areas.

## 4. User Approval Items
- [ ] Snap behavior (mandatory vs proximity).
- [ ] Record density in edge-to-edge view.
- [ ] Pagination control style (Minimal vs Buttons).

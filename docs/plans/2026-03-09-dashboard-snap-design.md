# Design: Full Page Snap Dashboard & Edge-to-Edge History

## Overview
Transform the dashboard from a standard scrolling list into a high-end snapped experience with two primary views: Overview and History. The History section will be optimized for browsing large amounts of data with an edge-to-edge design and pagination.

## Architecture & Layout

### 1. Dashboard Scroller
The main `DashboardPage` will act as a snap-scroll container.
- **Container**: `h-[calc(100vh-3.5rem)]` (accounting for navbar height) with `snap-y snap-mandatory` and `overflow-y-auto`.
- **Snap Sections**: 
    - `Section 1`: `min-h-full snap-start`. Contains Hero Card and Trends Chart.
    - `Section 2`: `min-h-full snap-start`. Contains the History Table.

### 2. History Section (Edge-to-Edge)
The `HistoryTable` component will be refactored to remove the "card" container when shown in this context.
- **Styles**: Remove `rounded-[2rem]`, `border`, and `shadow` from the outer wrapper.
- **List Items**: Full-width dividers between records. Consistent padding (e.g., `px-5`).
- **Sticky Header**: The History header (Title, Total, Filter/Export buttons) will stick to the top of Section 2.

### 3. Pagination
- **Logic**: Client-side pagination using a `currentPage` state (default 10 records/page).
- **Controls**: A minimalist pagination bar placed at the bottom of the History section, sitting immediately above the `StickyNavbar`.
- **Features**: Prev/Next buttons, "Page X of Y" indicator.

## Data Flow
- Data remains driven by the `useDashboardData` hook.
- Pagination is handled entirely in the `HistoryTable` component through local state and array slicing (`.slice(offset, offset + limit)`).
- Filtering automatically resets pagination to Page 1.

## UI/UX Polish
- **Animations**: Use Tailwind's transition utilities for smooth filter expansion.
- **Snap Behavior**: Use `scroll-behavior: smooth` for a fluid feel.
- **Persistence**: Dashboard view scroll position is reset on page load.

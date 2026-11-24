# CINEASTE WATCHLIST — THE PERSONAL FILM ARCHIVE
**Product Identity:** *Cineaste — Your Second Brain for Movies*  
**Design Direction:** *The Personal Film Archive (Final Unified Command Row & Architectural Stats)*  
**Target Path:** `D:\CINEASTE-INDEPENDENT\src\app\watchlist\page.tsx`  
**Date:** October 31, 2026

---

## 1. Executive Summary & Design Transformation

The Watchlist page has been completely refined into **The Personal Film Archive**, resolving the dual-search-bar clutter and consolidating fragmented controls into one balanced, premium command row:

1. **Single Search Experience:** The separate `Filter archive or genre...` input has been completely removed from the page body. Only **ONE search bar** exists on the screen &mdash; the global header search in `TopNav`. Any search query passed via URL (`?q=...`) automatically filters the archive by film title and genres with an active removable chip.
2. **Unified Command Row (`WatchlistCommandBar`):** Merged the previously disconnected status tabs and floating toolbar into **ONE cohesive horizontal command bar**:
   - **Left side:** 5 library categories (`Watchlist`, `Currently Watching`, `Watched`, `Favorites`, `All Films`) with live count badges and green active pill indicators.
   - **Right side:** Archive controls: **Sort Dropdown** (6 criteria), **Sort Direction Toggle** (`ASC`/`DESC`), **Collapsible Filters Button** (with active pulse dot), and **3-Way View Switcher** (`Grid`, `List`, `Compact`).
3. **Architectural Statistics Strip (`WatchlistStatsBar`):** Redesigned the 4 metrics (`Total Saved`, `Unwatched`, `Watched`, `Watch Time`) into a tight, horizontal architectural strip. Increased number prominence (`text-2xl sm:text-3xl font-heading font-black`) and left-aligned the custom vector marks (`VaultMark`, `OrbitMark`, `CompletionFrameMark`, `ChronoDial`) inside geometric housings (`w-10 h-10`), eliminating empty space on desktop.
4. **Active Removable Filter Chips (`WatchlistFilterChips`):** Rendered underneath the command bar whenever a filter or search query is active, allowing one-click removal and "Clear All".
5. **Tightened Empty State:** Reduced vertical footprint while preserving the custom `VaultMark` mark, clear typography, and action buttons for "Discover Films" and "Quick Add Film".

---

## 2. File Modification & Inventory

| File Path | Status | Role & Changes |
| :--- | :--- | :--- |
| [`src/components/watchlist/watchlist-command-bar.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/watchlist/watchlist-command-bar.tsx) | **NEW** | Unified horizontal command row combining the 5 status categories on the left with sort, direction, filters toggle, and 3-way view switcher on the right. Zero duplicate search inputs. |
| [`src/components/watchlist/watchlist-stats-bar.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/watchlist/watchlist-stats-bar.tsx) | **MODIFIED** | Redesigned into a compact, architectural metric strip with left-anchored custom vector marks, bold numbers, and reduced padding. |
| [`src/app/watchlist/page.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/app/watchlist/page.tsx) | **MODIFIED** | Connected to unified `WatchlistCommandBar`, eliminated duplicate search field, integrated with `useSearchParams` in `<React.Suspense>`, tightened empty state, and refined editorial typography. |
| [`src/components/watchlist/watchlist-filter-chips.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/watchlist/watchlist-filter-chips.tsx) | **REUSED** | Removable active filter chips for query, genre, year, runtime, score, and favorites. |
| [`src/components/watchlist/watchlist-filter-tray.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/watchlist/watchlist-filter-tray.tsx) | **REUSED** | Collapsible filter matrix for genre, year, runtime, score threshold, and favorites. |
| [`src/components/watchlist/watchlist-icons.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/watchlist/watchlist-icons.tsx) | **PRESERVED** | Pure inline SVG vector icon identity system for `VaultMark`, `OrbitMark`, `CompletionFrameMark`, `ChronoDial`, `CuratedStar`, and `ArchiveStack`. |
| [`src/components/watchlist/watchlist-movie-card.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/watchlist/watchlist-movie-card.tsx) | **PRESERVED** | 2/3 poster grid cards with score badges, status pills, and hover action overlay. |
| [`src/components/watchlist/watchlist-list-view.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/watchlist/watchlist-list-view.tsx) | **PRESERVED** | Editorial list rows with runtime, genres, personal ratings, and quick actions. |
| [`src/components/watchlist/watchlist-compact-view.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/watchlist/watchlist-compact-view.tsx) | **PRESERVED** | High-density table layout with 32px poster thumbnail, title, year, status, and removal. |
| [`src/components/watchlist/watchlist-detail-sheet.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/watchlist/watchlist-detail-sheet.tsx) | **PRESERVED** | Slide-over drawer with backdrop, cast credits, status switcher, 10-star rating, review notes textarea, and favorite toggle. |
| [`src/app/dashboard/page.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/app/dashboard/page.tsx) | **UNTOUCHED** | Zero changes made. |
| [`src/app/discover/page.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/app/discover/page.tsx) | **UNTOUCHED** | Zero changes made. |

---

## 3. Verification & Test Results

| Test Phase | Command / Check | Result |
| :--- | :--- | :--- |
| **TypeScript Validation** | `cmd /c npx tsc --noEmit` | **0 errors (Clean exit code 0)** |
| **Next.js Production Build** | `cmd /c npm run build` | **Successfully compiled static route `○ /watchlist` (12 kB)** |
| **Single Search Verification** | HTML inspection of `http://localhost:3000/watchlist` | **Exact count of `<input>` elements = 1 (in TopNav only). Duplicate `filter archive or genre` is 100% removed.** |
| **Unified Command Row** | Browser render check | **Status navigation and archive controls (sort, direction, filter, view switcher) render inside one balanced container.** |
| **Architectural Stats Strip** | Metric render check | **Tightly aligned left-anchored icons, bold numbers, and zero hollow space.** |
| **Unmodified Pages Check** | Timestamps on `/dashboard` and `/discover` | **Completely untouched** |
| **Dev Server Daemon** | `npm run dev -- --hostname 0.0.0.0` | **Running on port 3000** |

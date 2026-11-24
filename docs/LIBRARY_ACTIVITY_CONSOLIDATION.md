# CINEASTE — UNIFIED MY LIBRARY & ACTIVITY HUB CONSOLIDATION
**Product Identity:** *Cineaste — Your Second Brain for Movies*  
**Scope:** Navigation Consolidation, UI Unification, and Backend Preservation  
**Consolidations:**
1. **Favorites + Collections** $\rightarrow$ **My Library** (`/library`)
2. **Import + Timeline** $\rightarrow$ **Activity Hub** (`/activity`)

**Date:** October 31, 2026  
**Status:** Implementation & Verification Complete — All Routes Operational

---

## 1. Executive Summary

Four fragmented pages (`/favorites`, `/collections`, `/import`, `/timeline`) have been unified into **two editorial destinations**:

1. **`My Library` (`/library`)**: Unifies the **Favorites** archive and **Collections** workspace into a single personal curation hub.
2. **`Activity Hub` (`/activity`)**: Unifies the **Letterboxd Importer** and the **Cinema Viewing Timeline** into a single activity chronicle.

The left sidebar navigation has been streamlined from 7 main navigation items down to 5:
- `Dashboard`
- `Discover`
- `Watchlist`
- `My Library` *(NEW Unified Destination)*
- `Activity Hub` *(NEW Unified Destination)*

All existing data models, validation logic, processing workflows, and storage rules remain strictly preserved. Backward compatibility is guaranteed through HTTP 307 redirects and Next.js App Router route handlers.

---

## 2. File Inventory & Architecture

| File Path | Status | Role & Changes |
| :--- | :--- | :--- |
| [`src/app/library/page.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/app/library/page.tsx) | **NEW** | Unified My Library destination. Shared header, segmented internal tabs (`Favorites` vs `Collections`), URL query sync (`?tab=...`), integrated detail sheets and creation modals. Wrapped in `AppShell`. |
| [`src/components/library/favorites-section.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/library/favorites-section.tsx) | **NEW** | Rich editorial movie archive focused on real user favorites (`is_favorite = true`). Includes search, genre filter, era/decade filter, sorting, grid/list switcher, and poster quick actions. |
| [`src/components/library/collections-section.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/library/collections-section.tsx) | **NEW** | Curated collection shelf workspace. Intelligent poster collage cards (2x2 grid for 4+ films, fan stack for 1-3 films, accent glow for empty), collection count, search, and sorting. |
| [`src/components/library/create-collection-dialog.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/library/create-collection-dialog.tsx) | **NEW** | Modal for creating or editing collections with title validation, description, 8-color preset palette, and searchable film selection from the user's vault. |
| [`src/components/library/add-to-collection-dialog.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/library/add-to-collection-dialog.tsx) | **NEW** | Reusable modal to toggle a movie into/out of any collection, with inline quick collection creation. |
| [`src/components/library/collection-detail-sheet.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/library/collection-detail-sheet.tsx) | **NEW** | Slide-over drawer for an active collection: custom color banner, title/description, film count, poster grid, add films search dropdown, remove movie action, edit, and delete. |
| [`src/app/activity/page.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/app/activity/page.tsx) | **NEW** | Unified Activity Hub destination. Shared header, segmented internal tabs (`Import` vs `Movie Timeline`), URL query sync (`?tab=...`), state preservation across tab switches. Wrapped in `AppShell`. |
| [`src/components/activity/import-section.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/activity/import-section.tsx) | **NEW** | Letterboxd & CSV/JSON importer. Drag-and-drop dropzone, automatic header detection (`ratings.csv`, `watched.csv`, `watchlist.csv`), TMDB batch resolver, progress bar, conflict table, and duplicate detection. |
| [`src/components/activity/timeline-section.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/activity/timeline-section.tsx) | **NEW** | Chronological cinema diary grouped by month and year. Screening cards, star ratings, review snippets, activity type badges, stats ribbon (screenings, hours, avg rating), and event filters. |
| [`src/lib/library-store.ts`](file:///d:/CINEASTE-INDEPENDENT/src/lib/library-store.ts) | **EXPANDED** | Added collection CRUD (`createCollection`, `updateCollection`, `deleteCollection`, `addMovieToCollection`, `removeMovieFromCollection`), timeline activities store, and `batchImportMovies`. |
| [`src/lib/constants.ts`](file:///d:/CINEASTE-INDEPENDENT/src/lib/constants.ts) | **MODIFIED** | Updated `SIDEBAR_SECTIONS`, `MOBILE_NAV_ITEMS`, `QUICK_ACTIONS`, and `KEYBOARD_SHORTCUTS` (`l` for library, `a` for activity, `f` for favorites, `c` for collections, `t` for timeline). |
| [`src/components/layout/command-palette.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/layout/command-palette.tsx) | **MODIFIED** | Updated `JUMP_LINKS` to target `My Library` (`/library`) and `Activity Hub` (`/activity`). |
| [`src/components/layout/mobile-nav.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/components/layout/mobile-nav.tsx) | **MODIFIED** | Updated bottom navigation links and icons for unified destinations. |
| [`next.config.ts`](file:///d:/CINEASTE-INDEPENDENT/next.config.ts) | **MODIFIED** | Configured HTTP 307 redirects from old routes (`/favorites`, `/collections`, `/import`, `/timeline`) to the unified tabs. |
| [`src/app/favorites/page.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/app/favorites/page.tsx) | **REDIRECT** | Route fallback executing `redirect("/library?tab=favorites")`. |
| [`src/app/collections/page.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/app/collections/page.tsx) | **REDIRECT** | Route fallback executing `redirect("/library?tab=collections")`. |
| [`src/app/import/page.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/app/import/page.tsx) | **REDIRECT** | Route fallback executing `redirect("/activity?tab=import")`. |
| [`src/app/timeline/page.tsx`](file:///d:/CINEASTE-INDEPENDENT/src/app/timeline/page.tsx) | **REDIRECT** | Route fallback executing `redirect("/activity?tab=timeline")`. |

---

## 3. Strict Backend & Data Relationship Guarantees

All requirements regarding data independence were rigorously enforced:

1. **Independent Storage:**
   - User movies and favorites are stored in `cineaste:library:watchlist`.
   - Collections are stored in `cineaste:library:collections`.
   - Timeline activity logs are stored in `cineaste:library:activities`.
2. **Orthogonal Relationships:**
   - A film can be a favorite without belonging to any collection (`movie.is_favorite = true`).
   - A film can belong to any number of collections without being a favorite (`collection.movie_ids`).
   - Toggling a movie's favorite status does **not** alter collections.
   - Removing a movie from a collection does **not** delete the movie from the vault or unfavorite it.
   - Deleting a collection deletes only the shelf container; all movies and favorites remain untouched.
3. **Activity Hub State Preservation:**
   - In `ActivityHubPage`, both `ImportSection` and `TimelineSection` remain mounted using CSS display toggling (`block` vs `hidden`).
   - Switching to the Timeline while an import batch is resolving does **not** abort or reset the import progress.

---

## 4. Verification Evidence & Quality Gates

### A. TypeScript Type Safety
```bash
npx tsc --noEmit
# Exit code: 0 (Zero errors)
```

### B. Production Build
```
Route (app)                                 Size  First Load JS
┌ ○ /                                      138 B         103 kB
├ ○ /_not-found                            993 B         104 kB
├ ○ /activity                            8.36 kB         134 kB
├ ƒ /api/tmdb                              138 B         103 kB
├ ○ /collections                           138 B         103 kB
├ ○ /dashboard                           12.1 kB         142 kB
├ ○ /discover                            14.5 kB         145 kB
├ ○ /favorites                             138 B         103 kB
├ ○ /import                                138 B         103 kB
├ ○ /library                             10.6 kB         136 kB
├ ○ /settings                            4.33 kB         135 kB
├ ○ /timeline                              138 B         103 kB
└ ○ /watchlist                           10.8 kB         145 kB
```

### C. Backward-Compatible HTTP Redirects
```bash
GET /favorites    => HTTP 307 -> /library?tab=favorites
GET /collections  => HTTP 307 -> /library?tab=collections
GET /import       => HTTP 307 -> /activity?tab=import
GET /timeline     => HTTP 307 -> /activity?tab=timeline
```

### D. 1920x1080 Headless Browser Captures
- `screenshot_library_favorites.png`: Verified shared header, segmented tabs (`Favorites` active), search/filter toolbar, single TopNav search bar, sidebar highlight.
- `screenshot_library_collections.png`: Verified `Collections` active tab, command bar with `+ Create Collection`, search, sorting, and responsive layout.
- `screenshot_activity_import.png`: Verified `ACTIVITY HUB` header, `Import` active tab, source selector pills, dropzone, and sample CSV download.
- `screenshot_activity_timeline.png`: Verified `Movie Timeline` active tab, 4-card statistics ribbon, activity filters, and chronological groupings.

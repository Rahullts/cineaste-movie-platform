# CINEASTE — Comprehensive Quality, Architecture & Backend Audit

**Audit Date:** October 31, 2026  
**Product:** Cineaste — Your Second Brain for Movies  
**Project Path:** `D:\CINEASTE-INDEPENDENT`  
**Stack:** Next.js 15 (App Router) + TypeScript + Tailwind CSS + Supabase (PostgreSQL, Auth, Storage, RLS) + TMDB Discovery Gateway  
**Methodology:** Full source inspection, API execution testing, compiler verification, and live proxy validation.

---

## 1. Feature Classification Matrix

| Feature / Domain | Classification | Active Persistence Layer | Verified Status / Defects Identified |
| :--- | :--- | :--- | :--- |
| **Authentication Flow (Sign In / Sign Up)** | **Fully working** | Supabase Auth + Session Cookies | Real GoTrue authentication, modal state switcher, session token refresh middleware active. |
| **Password Reset** | **Fully working** | Supabase Auth (`/auth/reset-password`) | Recovery dispatch via email and dedicated branded reset page implemented. |
| **User Profile (`/profile`)** | **Fully working** | Supabase `profiles` + `localStorage` fallback | Avatar upload to Supabase Storage `avatars` bucket, display name, handle, bio, and genres synchronized. |
| **User Settings (`/settings`)** | **Fully working** | Supabase `user_preferences` + `localStorage` fallback | Theme, accent, density, autoplay, region, and privacy settings synchronized to PostgreSQL. |
| **Admin Panel (`/admin`)** | **Fully working** | Server-side API (`/api/admin/*`) | Independent PostgreSQL role check; feature flags, announcements, spotlights, and audit logs. |
| **Billing & Plans (`/billing`)** | **Partially working** | UI + PostgreSQL `user_subscriptions` (Read) | Displays tier, limits, and pricing. RLS blocks client mutations; Stripe webhook integration needed for live checkout. |
| **TMDB Discovery API Proxy (`/api/tmdb`)** | **Fully working** | Server-side Gateway (`https://eminent-cine-vault-flow.base44.app`) | Live verified: returns real TMDB data for trending, search, details, and Indian languages (`ta`, `te`, `ml`, `kn`, `hi`). |
| **Watchlist Core (`/watchlist`)** | **Partially working** | Hybrid: Supabase `user_movies` + `localStorage` | Status updates (want, watching, watched) and sorting work. Favorite controls currently clutter Watchlist and need removal. |
| **Dashboard (`/dashboard`)** | **Partially working** | Hybrid + TMDB Discovery | Shows real user saved/watched films, but contains excessive redundant discovery rails (Trending, Premieres, Reminders, Collections). Needs personal simplification. |
| **Discover (`/discover`)** | **Partially working** | TMDB Discovery API | Features trending and hidden gems, but currently lacks the required 5 distinct categories (Trending Now, New & Notable, Hidden Gems, Critically Acclaimed, Coming Soon) and Indian cinema weighting. |
| **Collections Management** | **Partially working** | Supabase `collections` & `collection_movies` | Collection CRUD and ordering work. Collections currently lives on `/library?tab=collections` rather than inside `/activity` as requested. |
| **Activity Importer** | **Fully working** | Client CSV/ZIP Parser + TMDB Matcher + Library Store | Parses Letterboxd, IMDb, and Cineaste JSON backups with TMDB matching and batch import. |
| **Cinema Timeline** | **Fully working** | Supabase `movie_activities` + `localStorage` | Filtered strictly to genuine user journey events (opened, added, watched) with chronological grouping. |
| **Floating Bottom Dock** | **Fully working** | Next.js Navigation | Centered floating dock (`/dashboard`, `/discover`, `/watchlist`, `/library`, `/activity`, `/settings`). |

---

## 2. In-Depth Technical Audit & Gap Analysis

### Gap 1: Dashboard Redundancy & Clutter
- **Current State:** The dashboard currently mounts 8 separate content rails:
  1. `DashboardHero` (Curated slides)
  2. `DashboardQuickDock`
  3. `Cinema Statistics Strip` (4 cards)
  4. `Recently Added` (Watchlist rail)
  5. `Recently Watched` (Viewing history)
  6. `Your Collections` (Horizontal shelf preview)
  7. `Because You Watched` (Recommendation rail)
  8. `Continue Exploring` (Regional/hidden rail)
  9. `Highest Rated & Favorites`
  10. `Upcoming Reminders` & `Upcoming Premieres`
- **Defect:** Violates the "Personal Cinema Space" design requirement. Discovery content belongs on Discover, while Collections belongs in Activity Hub.
- **Required Action:** Strip the Dashboard down to **ONLY** three primary sections:
  1. **Recently Added** (User's latest Watchlist additions with high-quality posters and detail click).
  2. **Recently Watched** (User's latest screenings with dates and personal ratings).
  3. **Continue Exploring** (Adaptive recommendation rail blending Indian and international cinema, excluding films already in the user's library).

### Gap 2: Discover Page Missing the 5 Standard Categories
- **Current State:** Discover currently shows a mixed feed of `Trending Today`, `Hidden Gems`, `Coming Soon`, and `People to Watch` (actors/directors).
- **Defect:** Missing `New & Notable` and `Critically Acclaimed` categories. Indian cinema representation is present via language filters, but not woven into the initial recommendation balance.
- **Required Action:** Restructure Discover into the 5 specified categories:
  1. **Trending Now** (Popular contemporary attention).
  2. **New & Notable** (Recent 2026 and notable theatrical releases).
  3. **Hidden Gems** (High vote average with focused vote counts).
  4. **Critically Acclaimed** (Award-winning, high critic/audience scores).
  5. **Coming Soon** (Confirmed future release dates).
- Weave South Indian (40%), Hindi (15%), and International (45%) cinema into the default discovery algorithms.

### Gap 3: Watchlist Cluttered with Redundant Favorite Controls
- **Current State:**
  - `activeTab` includes `"favorites"`.
  - Filter tray includes a `Favorites Only` checkbox.
  - Movie cards contain a gold heart/favorite button on hover and top-left badge.
  - List and Compact views include dedicated favorite toggle buttons.
- **Defect:** Clutters the dedicated Watchlist experience with duplicate library controls.
- **Required Action:** Remove favorite filter tabs, buttons, and badges from `/watchlist`. Preserve the underlying `is_favorite` database column and records for `/library` (My Library).

### Gap 4: Collections Architecture Placement
- **Current State:** Collections currently resides inside `/library?tab=collections` (My Library).
- **Defect:** Part 6 requires Collections to be consolidated as the second tab inside **Activity Hub** (`/activity?tab=collections`), identified by a diamond/gem icon, uniting Import, Collections, and Timeline under one destination.
- **Required Action:**
  - Move the rich Collections management interface into `/activity`.
  - Maintain the 3-tab layout: `Import`, `Collections`, `Timeline`.
  - Display collections with attractive movie poster collages rather than plain icon cards.

### Gap 5: Movie Card Detail Experience Click Handling
- **Current State:** On the Dashboard and Discover rails, `MovieRailCard` links to `/movie/${movie.tmdb_id}`, but there is no dedicated `/movie/[id]` page route. Clicking a card can lead to a 404 or unhandled route if the detail slide-over isn't wired.
- **Defect:** Inconsistent interaction model between Watchlist (slide-over sheet) and Rails (link to nonexistent page).
- **Required Action:** Ensure clicking any movie card across Dashboard, Discover, and Watchlist consistently opens the Cineaste movie detail experience (`WatchlistDetailSheet`).

---

## 3. Image URL & Artwork Integrity Audit
- **TMDB Poster Base:** `https://image.tmdb.org/t/p/w500` and `w342` are correctly used with fallback artwork placeholders.
- **Backdrop Base:** `https://image.tmdb.org/t/p/w1280` is used for high-resolution hero backdrops.
- **Aspect Ratios:** All movie posters strictly maintain `aspect-[2/3]`.
- **Image Error Handling:** Image components implement `onError` fallbacks displaying a cinematic placeholder with the film title, preventing broken image icon boxes.

---

## 4. Execution Readiness

- **Database Migrations:** Clean and hardened with `SECURITY DEFINER` search-paths and non-recursive RLS.
- **TypeScript:** Clean compilation with 0 errors.
- **Production Build:** Next.js App Router static and dynamic routes compile successfully.
- **Phase Execution Order:**
  1. [x] Phase 1: Quality and Backend Audit (`CINEASTE_PRODUCT_AUDIT.md`)
  2. [ ] Phase 2: Dashboard Simplification (3 sections only)
  3. [ ] Phase 3: Discover Page (5 categories)
  4. [ ] Phase 4: Indian-First Discovery Integration
  5. [ ] Phase 5: Watchlist Cleanup (Favorite controls removal)
  6. [ ] Phase 6: Activity Hub 3-Tab Structure (Import + Collections + Timeline)
  7. [ ] Phase 7: Verification & Final Report (`CINEASTE_REFINEMENT_REPORT.md`)

# CINEASTE — MASTER SUPABASE BACKEND MIGRATION PLAN
**Document Version:** 1.0.0  
**Application:** Cineaste — Your Second Brain for Movies  
**Repository:** `D:\CINEASTE-INDEPENDENT`  
**Migration Target:** Supabase (PostgreSQL 15+, Auth, Storage, Row Level Security, SSR)

---

## 1. Existing Architecture & State of the Application

Cineaste is currently an independent Next.js 15 (React 19) web application featuring a dark obsidian editorial UI, green brand accents (`#00D664`), and a high degree of client-side reactivity.

### Frontend Layers:
- **Presentation Layer:** Next.js App Router (`src/app`), page routes (`/dashboard`, `/discover`, `/watchlist`, `/library`, `/activity`, `/profile`, `/billing`, `/settings`, `/admin`), and responsive UI components (`src/components/*`).
- **Navigation Shell:** Sticky top navigation with search & account dropdown (`TopNav`), fixed bottom-center 6-item floating dock (`FloatingDock`), and keyboard command palette (`CommandPalette`).
- **Client State / Storage Layer:**
  - `library-store.ts` (`useLibrary` hook): Manages user movies, custom collections, and timeline activity logs in browser `localStorage`. Dispatches `cineaste:library-change` custom DOM events for cross-component reactivity.
  - `user-context.tsx` (`useUser` hook): Manages user profile identity, subscription tiers, and preference settings in `localStorage` (`cineaste:user_profile:v1`). Dynamically modifies DOM attributes (`--primary` CSS variable, `high-contrast`, `reduce-motion`, `data-density`).
  - `theme-context.tsx` (`useTheme` hook): Manages dark/light/system theme in `localStorage` (`cineaste:theme`).
- **External Data Layer:** Server-side TMDB proxy (`/api/tmdb`) used for search queries, trending titles, credits, and backdrop images.

---

## 2. Current Storage Mechanisms

Currently, **all user data is strictly isolated to the individual client browser** using the Web Storage API (`localStorage`):
- No multi-user separation exists on a shared browser.
- Clearing browser cache or switching devices completely erases or decouples the user's movie collections, watchlist status, ratings, and diary timeline.
- Administrative controls and feature flags are stored locally in the admin's browser, preventing true platform-wide governance.
- There are no server-side user tables, session cookies, or PostgreSQL foreign keys.

---

## 3. Complete Inventory of Existing LocalStorage Keys

| Key | Purpose | Data Type / Schema | Consumers |
| :--- | :--- | :--- | :--- |
| `cineaste:library:watchlist` | User's tracked movies, statuses, ratings, reviews, watched dates | `Movie[]` | `useLibrary()`, Watchlist, Dashboard, Profile, Export |
| `cineaste:library:collections` | Custom curated film lists, colors, ordered movie ID arrays | `Collection[]` | `useLibrary()`, My Library, Dashboard, Profile, Export |
| `cineaste:library:activities` | Chronological movie journey milestones (viewed, added, watched) | `TimelineActivity[]` | `useLibrary()`, Activity Hub Timeline, Profile |
| `cineaste:user_profile:v1` | User profile, subscription status, and all 9 settings categories | `UserProfile` | `useUser()`, TopNav, Profile, Settings, Billing, Admin |
| `cineaste:theme` | Visual appearance theme preference | `"dark" \| "light" \| "system"` | Root layout inline script, `useTheme()` |
| `cineaste:recently-viewed` | TMDB IDs of recently clicked film detail sheets | `number[]` | Discover page recent rail |
| `wl_view` | Watchlist layout presentation choice | `"grid" \| "list" \| "compact"` | Watchlist view toolbar |
| `cinebrain:recent-searches` | Cached search query history | `string[]` | TopNav search input, Discover search bar, Command palette |
| `cineaste_recent_searches` | Fallback search history cache | `string[]` | Command palette fallback |
| `cineaste:admin:users` | Local admin directory overrides | `AdminUser[]` | Admin panel Users tab |
| `cineaste:admin:featured` | Local spotlight movie curation | `FeaturedFilm[]` | Admin panel Featured tab |
| `cineaste:admin:announcements` | Local platform broadcast announcements | `Announcement[]` | Admin panel Announcements tab |
| `cineaste:admin:flags` | Local experimental feature flags | `FeatureFlag[]` | Admin panel Feature Flags tab |
| `cineaste:admin:moderation` | Local collection comments queue | `ModerationItem[]` | Admin panel Moderation tab |

---

## 4. Existing Data Models and Relationships

### 1. `Movie`
- `id` / `tmdb_id`: Unique identifier from TMDB.
- `title`, `overview`, `poster_path`, `backdrop_path`, `release_date`, `runtime`, `vote_average`, `genres`: External film metadata.
- `status`: `"want" | "watching" | "watched" | "dropped"`.
- `is_favorite`: `boolean` (independent of status).
- `rating`: `number` (0 to 10 scale).
- `review`: `string` (personal reflection / diary note).
- `watched_date`: `string` (`YYYY-MM-DD`).
- `created_date`, `updated_date`: ISO timestamps.

### 2. `Collection`
- `id`: Unique string (`col-<timestamp>-<hash>`).
- `title`, `description`, `color`, `is_public`: Metadata.
- `movie_ids`: Array of TMDB IDs preserving custom curation order.
- `movies`: Denormalized cached array of `Movie` objects.

### 3. `TimelineActivity`
- `id`: Unique string (`act-<timestamp>-<hash>`).
- `type`: `"viewed" | "added" | "watched"`.
- `tmdb_id`, `title`, `poster_path`: Movie reference.
- `rating`, `review`, `metadata`: Contextual attributes.
- `occurred_at`: Real ISO event timestamp.

### 4. `UserProfile` & `UserSettings`
- Identity: `id`, `email`, `display_name`, `handle`, `role` (`"admin" | "user"`), `avatar_url`, `bio`, `member_since`.
- Settings: `theme`, `accent`, `density`, `autoplay_trailers`, `rating_system`, `region`, `email_notifications`, `push_notifications`, `profile_visibility`, `show_activity`, `show_watchlist`, `language`, `reduce_motion`, `high_contrast`.
- Subscription: `plan` (`"free" | "pro" | "premium"`), `status`.

---

## 5. Components and Pages Dependent on the Library Store

The following 9 core areas directly subscribe to `useLibrary()` and depend on its contract:
1. `src/app/dashboard/page.tsx`: Reads library counts, watched list, watchlist map, hero actions.
2. `src/app/watchlist/page.tsx`: Filters, sorts, updates statuses, edits personal ratings.
3. `src/app/library/page.tsx`: Favorites section, Collections management, add/remove/reorder film cards.
4. `src/app/activity/page.tsx`: Timeline journey feed, RFC 4180 CSV / Letterboxd / IMDb batch importer.
5. `src/app/profile/page.tsx`: Watched, saved, favorites, collections count, watch time, 5 Base44 achievements.
6. `src/app/settings/page.tsx`: Library export (`cineaste-export.json`), reset vault data.
7. `src/app/admin/page.tsx`: Real library metrics, spotlight film selector.
8. `src/app/discover/page.tsx`: Quick watchlist/watched toggles on trending cards.
9. `src/components/layout/quick-add-dialog.tsx`: Direct modal searching and adding to library/collections.

---

## 6. Required Database Tables in Supabase PostgreSQL

To normalize data, avoid TMDB metadata duplication, and enforce multi-user Row Level Security, the following schema will be deployed:

```
auth.users (Supabase managed)
  ├── profiles (1:1 with auth.users)
  ├── user_preferences (1:1 with auth.users)
  ├── user_roles (1:1 with auth.users - server-controlled)
  ├── collections (1:N with auth.users)
  │     └── collection_movies (N:M with collections and movies)
  ├── user_movies (1:N with auth.users, N:1 with movies)
  ├── movie_activities (1:N with auth.users, N:1 with movies)
  └── user_subscriptions (1:1 with auth.users)

movies (Shared catalog cache keyed on tmdb_id)
  └── referenced by user_movies, collection_movies, movie_activities

admin_featured_spotlight (Shared platform curation)
admin_announcements (Platform broadcast messages)
admin_feature_flags (Server-governed feature flags)
admin_moderation_records (Flagged items queue)
admin_audit_logs (Immutable audit trail of privileged mutations)
```

---

## 7. Migration Risks & Mitigations

| Risk | Severity | Mitigation Strategy |
| :--- | :--- | :--- |
| **Data Loss During Migration** | Critical | Create a local immutable JSON backup in `localStorage` (`cineaste:backup:pre-supabase:<timestamp>`) before any cloud migration executes. |
| **Breaking Existing Component Signatures** | High | Keep `useLibrary()` API identical. Implement a hybrid repository: if authenticated, sync with Supabase; if guest/offline, gracefully fall back to local storage. |
| **Double Migration on Multiple Logins** | High | Store a migration record (`profiles.local_migrated_at` or `user_preferences.migration_status`) and set `cineaste:migrated:<user_id>` in localStorage. |
| **Cloud Overwrites Local Data on Conflicts** | High | Implement additive conflict resolution: union movies and collections by TMDB ID, prioritizing records with reviews/ratings. |
| **Leaking Service Role Key** | Critical | Never import or reference `SUPABASE_SERVICE_ROLE_KEY` in any client component. Only use in `/api/admin` or trusted server contexts. |
| **Admin Privilege Escalation** | High | Admin role checks must be verified via Postgres RLS (`auth.jwt() -> user_roles.role = 'admin'`) and server-side RPC functions. |

---

## 8. Proposed Phased File Changes

### New Infrastructure Files:
- `src/lib/supabase/client.ts` (Browser Supabase client using `@supabase/ssr`)
- `src/lib/supabase/server.ts` (Server Supabase client for Server Components and Route Handlers)
- `src/lib/supabase/middleware.ts` (Next.js session refresh middleware)
- `src/lib/supabase/database.types.ts` (TypeScript interfaces matching Postgres schema)
- `src/lib/supabase/library-repository.ts` (CRUD methods interfacing with Supabase Postgres)
- `src/lib/supabase/migration-service.ts` (Idempotent localStorage-to-Supabase migration)
- `src/components/auth/auth-modal.tsx` (Cinematic sign-in / sign-up modal matching Cineaste dark UI)
- `supabase/migrations/20261031_initial_schema.sql` (Tables, constraints, foreign keys, triggers)
- `supabase/migrations/20261031_rls_policies.sql` (Row Level Security policies and helper functions)
- `supabase/migrations/20261031_admin_tables.sql` (Admin spotlight, announcements, flags, audit logs)

### Modified Files (Non-Destructive Adaptations):
- `src/lib/library-store.ts`: Connect to `library-repository.ts` when session is active, maintaining fallback.
- `src/lib/user-context.tsx`: Wire to `supabase.auth.onAuthStateChange`, real user profile and preferences.
- `src/components/layout/top-nav.tsx`: Add Sign In / Sign Up triggers when unauthenticated; real user details when signed in.
- `src/app/settings/page.tsx`: Sync preferences to `user_preferences` table when authenticated.
- `src/app/profile/page.tsx`: Sync profile info and avatar upload to Supabase Storage.
- `src/app/admin/page.tsx`: Route privileged mutations through secure API endpoints with server authorization.
- `.env.example`: Document required Supabase environment variables.

---

## 9. Rollback Strategy

1. **Zero Breaking Changes to UI:** If Supabase environment variables are missing or unconfigured, the application automatically operates in local mode (`localStorage`), guaranteeing that existing features remain 100% operational.
2. **Local Storage Pre-Migration Snapshot:** Before writing to Supabase, all existing `cineaste:library:*` keys are copied to `cineaste:backup:v1`. If cloud sync fails, the user can restore from local backup with one click.
3. **No Irreversible Destructive Actions:** Supabase migrations are additive and non-destructive.

---
*End of Migration Plan.*

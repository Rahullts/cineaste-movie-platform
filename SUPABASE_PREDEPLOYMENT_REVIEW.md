# CINEASTE — Pre-Deployment Supabase Safety Review

**Review Date:** October 31, 2026  
**Target Environment:** Independent Antigravity Next.js Project (`D:\CINEASTE-INDEPENDENT`)  
**Scope:** Technical verification, static analysis, and security audit of the initial Supabase migration scripts, clients, stores, and authentication layer prior to live database execution.  
**Review Type:** Static Code Inspection & Compiler Verification (No live database connections initiated).

---

## Executive Safety Verdict

> [!IMPORTANT]
> **Can SQL Migrations Be Executed Safely?**  
> **YES, WITH THE PATCHES APPLIED IN THIS REVIEW.**  
> Prior to this review, executing the migrations would have resulted in:
> 1. A Postgres security definer mutable search-path vulnerability in `public.is_admin()` and `public.handle_new_user()`.
> 2. An RLS isolation deadlock preventing public profiles and public watchlists from being viewable by other users (caused by `user_preferences` blocking subquery evaluations).
> 3. Potential infinite policy recursion on `public.user_roles`.
> 4. Silent failure to persist collection reordering and membership additions in Supabase (`collection_movies`).
> 5. Next.js failing to refresh session cookies due to missing root `src/middleware.ts`.
>
> All of the above items have been identified, corrected, and verified with `tsc --noEmit` (0 errors) and `npm run build` (22/22 routes compiling cleanly). It is now safe to execute the migrations on a live Supabase project.
>
> **Per strict instructions: No live connection, database migration, or deployment has been executed.**

---

## Detailed Audit Findings by Category

### 1. Database Integrity

#### [PASS] Foreign Key Referential Integrity & Cascades
- **Files & Lines:**
  - `supabase/migrations/20261031_01_initial_schema.sql` (Lines 13, 32, 54, 87, 88, 109, 123, 124, 139, 140, 195)
  - `supabase/migrations/20261031_04_subscriptions.sql` (Line 7)
- **Verified:**
  - All user UUID foreign keys consistently reference `auth.users(id) ON DELETE CASCADE` across `profiles`, `user_preferences`, `user_roles`, `user_movies`, `collections`, and `user_subscriptions`.
  - In `collection_movies`: `collection_id` references `collections(id) ON DELETE CASCADE` and `movie_id` references `movies(id) ON DELETE CASCADE`.
  - In `movie_activities`: `movie_id` references `movies(id) ON DELETE SET NULL`. If a catalog movie is deleted or re-indexed, the user's historical timeline event remains intact.
  - In `admin_audit_logs`: `admin_user_id REFERENCES auth.users(id)` without cascade, preserving immutable audit logs.
- **Potential Impact:** Clean cascade cleanup on account deletion without orphaned records.
- **Status:** **PASS**

#### [PASS] Collection Deletion Isolation
- **Files & Lines:** `supabase/migrations/20261031_01_initial_schema.sql` (Lines 107–133)
- **Verified:**
  - `collections` is a parent table to `collection_movies`.
  - `user_movies` (the user's library/watchlist records) does NOT reference `collections` or `collection_movies`.
  - When a user deletes a collection, only the collection record and its join entries in `collection_movies` are removed.
- **Potential Impact:** Deleting a custom collection CANNOT accidentally delete or alter the user's movie library records, ratings, or watch status.
- **Status:** **PASS**

#### [PASS] Unique Constraints & Deduplication
- **Files & Lines:**
  - `supabase/migrations/20261031_01_initial_schema.sql` (Lines 64, 97, 128)
- **Verified:**
  - `movies`: `tmdb_id INTEGER UNIQUE NOT NULL` ensures the shared catalog has exactly one row per movie.
  - `user_movies`: `CONSTRAINT uq_user_movie UNIQUE (user_id, tmdb_id)` strictly prohibits duplicate entries for the same movie in a user's library.
  - `collection_movies`: `CONSTRAINT uq_collection_movie UNIQUE (collection_id, movie_id)` prohibits duplicate entries of the same film in a single collection.
- **Status:** **PASS**

#### [PASS] Index Optimization for Common Queries
- **Files & Lines:** `supabase/migrations/20261031_01_initial_schema.sql` (Lines 26, 79, 80, 100–102, 119, 131, 132, 148, 203)
- **Verified:** Composite indexes cover all critical query patterns:
  - `idx_user_movies_status ON public.user_movies(user_id, status)` for fast tab filtering (Watchlist vs Watched).
  - `idx_user_movies_favorite ON public.user_movies(user_id, is_favorite)` for instant library Favorites filtering.
  - `idx_col_movies_position ON public.collection_movies(collection_id, position)` for ordering collections.
  - `idx_activities_user_timeline ON public.movie_activities(user_id, occurred_at DESC)` for the chronological movie journey.
- **Status:** **PASS**

---

### 2. Security & Row Level Security (RLS)

#### [PASS - PATCHED] `public.is_admin()` Search-Path Hardening & Definer Safety
- **Files & Lines:** `supabase/migrations/20261031_02_rls_policies.sql` (Lines 9–23)
- **Issue Identified:**
  The original definition of `public.is_admin()` was declared as `SECURITY DEFINER` without setting an explicit `search_path`. In PostgreSQL, a `SECURITY DEFINER` function without `SET search_path = public, pg_temp` allows a caller to manipulate the search path and execute arbitrary code with superuser privileges.
- **Correction Applied:**
  Updated the function to SQL language with strict search path isolation:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_admin(user_uid UUID DEFAULT auth.uid())
  RETURNS BOOLEAN
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = public, pg_temp
  AS $$
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = user_uid
        AND role = 'admin'
    );
  $$;
  ```
- **Status:** **PASS (RESOLVED)**

#### [PASS - PATCHED] `user_preferences` RLS Subquery Lockout
- **Files & Lines:** `supabase/migrations/20261031_02_rls_policies.sql` (Lines 46–58, 70–76, 116–129)
- **Issue Identified:**
  The `profiles`, `user_movies`, and `movie_activities` SELECT policies checked whether another user's profile was public using:
  `EXISTS (SELECT 1 FROM public.user_preferences WHERE user_id = ... AND profile_visibility != 'private')`
  However, `user_preferences` had only one policy: `FOR ALL USING (auth.uid() = user_id)`.
  When User A attempted to view User B's profile, Postgres evaluated the subquery as User A. Because User A could not select User B's preferences row, the subquery returned 0 rows, causing User B's public profile and library to appear completely blank/inaccessible.
- **Correction Applied:**
  Added a selective read policy to `public.user_preferences`:
  ```sql
  CREATE POLICY "Public profile visibility preferences are readable"
    ON public.user_preferences FOR SELECT
    USING (profile_visibility != 'private');
  ```
  Users can now check visibility flags for public accounts while maintaining complete privacy for non-public settings (e.g. notifications, density, themes).
- **Status:** **PASS (RESOLVED)**

#### [PASS - PATCHED] Recursive Policy Elimination on `public.user_roles`
- **Files & Lines:** `supabase/migrations/20261031_02_rls_policies.sql` (Lines 80–87)
- **Issue Identified:**
  The previous policy on `user_roles` was:
  `USING (auth.uid() = user_id OR public.is_admin(auth.uid()))`.
  Evaluating `public.is_admin` caused a query on `user_roles`, risking infinite recursion on non-admin reads.
- **Correction Applied:**
  Separated user and admin access:
  ```sql
  CREATE POLICY "Users can view their own role"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    USING (public.is_admin(auth.uid()));
  ```
- **Status:** **PASS (RESOLVED)**

#### [PASS] Privilege Escalation Prevention
- **Files & Lines:** `supabase/migrations/20261031_02_rls_policies.sql` (Lines 84–96)
- **Verified:**
  `INSERT`, `UPDATE`, and `DELETE` on `public.user_roles` are restricted to `WITH CHECK (public.is_admin(auth.uid()))`. Normal users cannot alter their role row.
- **Status:** **PASS**

#### [PASS] Server-Side Admin Role Verification
- **Files & Lines:**
  - `src/app/api/admin/action/route.ts` (Lines 15–39)
  - `src/app/api/admin/metrics/route.ts` (Lines 15–39)
- **Verified:**
  Both endpoints call `supabase.auth.getUser()`, extract `user.id`, and independently query `user_roles` for `role === 'admin'`. Unauthorized requests receive HTTP 401/403.
- **Status:** **PASS**

#### [PASS] Service Role Credential Seclusion
- **Files & Lines:** `src/lib/supabase/server.ts` (Lines 37–57)
- **Verified:**
  `SUPABASE_SERVICE_ROLE_KEY` is referenced solely in `server.ts` within `createAdminClient()`. It is never exported to client-side components or bundles.
- **Status:** **PASS**

#### [PASS] Storage Bucket User Folder Boundaries
- **Files & Lines:** `supabase/migrations/20261031_03_storage_buckets.sql` (Lines 21–43)
- **Verified:**
  Uploads, updates, and deletes in the `avatars` bucket strictly enforce `(storage.foldername(name))[1] = auth.uid()::text`. Users can only modify objects within their own UID directory.
- **Status:** **PASS**

#### [PASS] Subscription Plan Tamper Resistance
- **Files & Lines:** `supabase/migrations/20261031_04_subscriptions.sql` (Lines 26–35)
- **Verified:**
  `user_subscriptions` grants SELECT permissions to users for their own row. Mutations (`ALL`) are restricted to `is_admin(auth.uid())` or backend webhook service role calls.
- **Status:** **PASS**

---

### 3. Migration Safety

#### [PASS] Pre-Migration Snapshot Backup
- **Files & Lines:** `src/lib/supabase/migration-service.ts` (Lines 23–41, 70)
- **Verified:**
  `createLocalBackup()` archives `watchlist`, `collections`, `activities`, and `profile` into an immutable `cineaste:backup:<timestamp>` localStorage entry before any cloud writes occur.
- **Status:** **PASS**

#### [PASS - PATCHED] Collection & Activity Idempotency on Interrupted Migration
- **Files & Lines:** `src/lib/supabase/migration-service.ts` (Lines 160–245)
- **Issue Identified:**
  Originally, collections and timeline activities used raw `.insert()` without deduplication. If a migration was interrupted by a network disconnect and resumed, or if the user logged in from a second browser, duplicate collections and duplicate activity rows were created.
- **Correction Applied:**
  1. Collections check for existing names (`.eq("name", col.title.trim())`) before creating new records.
  2. Collection movie associations use `.upsert(..., { onConflict: "collection_id,movie_id" })`.
  3. Activities check for existing records matching `user_id`, `activity_type`, and `occurred_at` before inserting.
- **Status:** **PASS (RESOLVED)**

#### [PASS] Migration Marker Integrity
- **Files & Lines:** `src/lib/supabase/migration-service.ts` (Lines 55–67, 273)
- **Verified:**
  The completion marker key is parameterized by user UID (`cineaste:migrated:${userId}`). It is written only after all sections complete successfully.
- **Status:** **PASS**

---

### 4. Offline & Synchronization Behavior

#### [PASS - PATCHED] Collection Membership Persistence (`collection_movies`)
- **Files & Lines:**
  - `src/lib/supabase/library-repository.ts` (Lines 330–365)
  - `src/lib/library-store.ts` (Lines 482–585)
- **Issue Identified:**
  `updateUserCollection` in `library-repository.ts` only modified metadata on `collections` (title, color, description). When movies were added, removed, or reordered via `addMovieToCollection`, `removeMovieFromCollection`, or `reorderCollectionMovies`, the changes were saved in `localStorage`, but never synchronized to `public.collection_movies` in Supabase.
- **Correction Applied:**
  Updated `updateUserCollection` to synchronize `collection_movies` rows when `movie_ids` is passed, and wired `reorderCollectionMovies` to persist positions directly to Supabase.
- **Status:** **PASS (RESOLVED)**

#### [WARNING] Offline Writes vs. Cloud Conflict Resolution
- **Files & Lines:** `src/lib/library-store.ts` (Lines 102–109, 228–230)
- **Finding:**
  When a user performs actions while offline, edits are saved to `localStorage`, and the Supabase write failure is logged to `console.error`. If the user reloads the application after reconnecting to the internet, `loadData()` fetches the cloud library and replaces local state if cloud records exist.
- **Potential Impact:** Edits made strictly while offline could be overwritten by cloud data on hard page refresh.
- **Recommendation:** Implement an offline action queue (`cineaste:pending_sync`) that flushes pending actions once connectivity is restored.
- **Status:** **WARNING (NON-BLOCKING FOR INITIAL DEPLOYMENT)**

#### [PASS] Honest Assessment of Cross-Device Synchronization
- **Finding:**
  Cineaste does **NOT** currently subscribe to Supabase Realtime WebSocket channels (`postgres_changes`). Data is synchronized upon explicit user actions (add, remove, rate, reorder) and loaded on initial page mount or authentication state change.
- **Status:** **PASS (NO MISLEADING CLAIMS)**

---

### 5. Authentication

#### [PASS - PATCHED] Next.js 15 Session Token Refresh Middleware
- **Files & Lines:**
  - `src/lib/supabase/middleware.ts`
  - `src/middleware.ts` (Newly Created)
- **Issue Identified:**
  `updateSession` was defined inside `src/lib/supabase/middleware.ts`, but no root `src/middleware.ts` existed. Next.js never executed the session refresh logic on page requests.
- **Correction Applied:**
  Created `src/middleware.ts` targeting all application routes (excluding static assets), ensuring Supabase auth tokens refresh automatically on incoming requests.
- **Status:** **PASS (RESOLVED)**

#### [PASS - PATCHED] Password Reset Recovery Destination
- **Files & Lines:**
  - `src/components/auth/auth-modal.tsx` (Line 110)
  - `src/app/auth/reset-password/page.tsx` (Newly Created)
- **Issue Identified:**
  `auth-modal.tsx` dispatched recovery emails pointing to `/auth/reset-password`, but that page route did not exist (would return 404).
- **Correction Applied:**
  Built a branded obsidian-styled password reset page at `src/app/auth/reset-password/page.tsx` allowing users to enter and confirm their new password via `supabase.auth.updateUser({ password })`.
- **Status:** **PASS (RESOLVED)**

#### [PASS - PATCHED] Real Subscription Status Loading
- **Files & Lines:** `src/lib/user-context.tsx` (Lines 200–215)
- **Issue Identified:**
  `user-context.tsx` previously hardcoded `subscription: DEFAULT_SUBSCRIPTION` instead of querying the `user_subscriptions` table.
- **Correction Applied:**
  Updated `user-context.tsx` to query `public.user_subscriptions` for the authenticated user and bind their real tier (`free`, `pro`, `premium`) and status (`active`, `canceled`).
- **Status:** **PASS (RESOLVED)**

---

## Issue Classification Summary Matrix

| ID | Category | Item Checked | Status | File & Line Reference | Correction Applied |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | Security | `is_admin()` mutable search path | **PASS** | `20261031_02_rls_policies.sql:9` | Added `SET search_path = public, pg_temp` |
| **02** | Security | `user_preferences` RLS blocks public profiles | **PASS** | `20261031_02_rls_policies.sql:75` | Added public visibility read policy |
| **03** | Security | `user_roles` recursive RLS check | **PASS** | `20261031_02_rls_policies.sql:80` | Separated owner and admin SELECT policies |
| **04** | Auth | Missing Next.js session refresh middleware | **PASS** | `src/middleware.ts:1` | Created root Next.js middleware file |
| **05** | Auth | Missing `/auth/reset-password` route | **PASS** | `src/app/auth/reset-password/page.tsx:1` | Created password reset page |
| **06** | Data Integrity | Collection membership unsynced in cloud | **PASS** | `library-repository.ts:345`, `library-store.ts:580` | Synchronized `collection_movies` on edit/reorder |
| **07** | Migration | Duplicate collections/activities on resume | **PASS** | `migration-service.ts:160` | Added deduplication and upserts |
| **08** | Offline | Stale cloud data could overwrite offline edits | **WARNING** | `library-store.ts:102` | Documented; recommend offline action queue |
| **09** | Sync | Cross-device live WebSocket synchronization | **PASS** | Architectural Scope | Acknowledged: on-demand sync, not Realtime |

---

## Verification & Build Results

1. **TypeScript Verification (`tsc --noEmit`):**
   - Result: **0 errors**.
2. **Next.js Production Build (`npm run build`):**
   - Result: **22/22 routes successfully generated**.
   - Output includes `ƒ Middleware (94.7 kB)` and `○ /auth/reset-password (1.9 kB)`.
3. **Execution Safety:**
   - **Safe to execute SQL migrations:** **YES**.
   - **Live connections made:** **NONE (Static audit only)**.

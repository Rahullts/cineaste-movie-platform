# CINEASTE — Comprehensive Supabase SQL Final Security Review

**Product:** Cineaste — Your Second Brain for Movies  
**Project Path:** `D:\CINEASTE-INDEPENDENT`  
**Date:** October 31, 2026  
**Execution-Readiness Verdict:** **READY FOR CONTROLLED TESTING**  
**Live DB Execution Status:** **NOT EXECUTED** (Zero commands run against live databases; awaiting user approval)  

---

## 1. Executive Summary & Verdict

Following a rigorous, multi-vector security, schema, and RLS audit, all four Supabase migration files in `supabase/migrations/` have been hardened and corrected:
1. `20261031_01_initial_schema.sql`
2. `20261031_02_rls_policies.sql`
3. `20261031_03_storage_buckets.sql`
4. `20261031_04_subscriptions.sql`

### Final Verdict: **READY FOR CONTROLLED TESTING**
- The SQL files are syntactically balanced, fully idempotent, non-destructive, and resilient against existing-table upgrade anomalies.
- All high-severity attack vectors—including whole-row preferences exposure, feature-flag leaks, arbitrary admin status probing, client catalog metadata tampering, and plan self-escalation—have been systematically neutralized.

---

## 2. In-Depth Analysis of Security Corrections

### A. Shared Movie Metadata Writes Restricted to Server Operations
- **Vulnerability Identified:** The prior draft granted all authenticated client users direct `INSERT` and `UPDATE` permissions on `public.movies`. Any authenticated user could send malicious queries to overwrite titles, release years, poster paths, or overviews in the shared global cache.
- **Correction Applied in `20261031_02_rls_policies.sql`:**
  - Removed client-side `INSERT` and `UPDATE` policies for general authenticated users.
  - Granted `INSERT`, `UPDATE`, and `DELETE` strictly to `public.is_admin()`.
  - When server-side routes or edge functions update catalog data from TMDB (e.g., via the server-side TMDB proxy or background sync jobs), they utilize the Supabase `service_role` key, which bypasses RLS securely on the server.
  - Preserved universal `SELECT` access (`USING (true)`) so all users can browse shared film metadata without interruption.
  - The `service_role` key remains strictly server-side and is never exposed to client bundles.

### B. Feature Flags Protection & Leak Prevention
- **Vulnerability Identified:** `public.admin_feature_flags` had a SELECT policy of `USING (true)`, allowing unauthenticated and non-admin users to inspect internal feature flags, discovering unreleased, disabled, or confidential platform experiments.
- **Correction Applied in `20261031_02_rls_policies.sql`:**
  - Ordinary users are strictly restricted to reading `enabled = true` flags.
  - Administrators (`public.is_admin()`) can inspect all flags (both enabled and disabled).
  - All write operations (INSERT, UPDATE, DELETE) remain locked strictly to administrators.

### C. Parameterless, Hardened Admin Helper (`public.is_admin()`)
- **Vulnerability Identified:** The previous function signature was `public.is_admin(user_uid UUID DEFAULT auth.uid())`. By accepting an arbitrary `user_uid` parameter, malicious callers could execute `SELECT public.is_admin('<target-uuid>')` to map platform administrators and target high-privilege accounts.
- **Correction Applied in `20261031_02_rls_policies.sql` & `20261031_04_subscriptions.sql`:**
  - Dropped the legacy parameterized signature: `DROP FUNCTION IF EXISTS public.is_admin(UUID);`.
  - Replaced it with a zero-parameter helper:
    ```sql
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS BOOLEAN
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $$
      SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = 'admin'
      );
    $$;
    ```
  - `auth.uid()` is evaluated internally from the cryptographically verified JWT session. No caller can supply or probe arbitrary user IDs.
  - `SECURITY DEFINER` with fixed `search_path = public, pg_temp` prevents search-path hijacking and avoids recursive RLS evaluation when querying `public.user_roles`.
  - All RLS policies calling `is_admin(...)` have been updated to call `public.is_admin()`.

### D. Existing-Table Upgrade Safety & Accurate Idempotency
- **Technical Insight:** In PostgreSQL, `CREATE TABLE IF NOT EXISTS` is a no-op if the table already exists. It does NOT add missing columns, update column defaults, or add constraints.
- **Correction Applied in `20261031_01_initial_schema.sql` & `20261031_04_subscriptions.sql`:**
  - Added conditional `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` for every table to guarantee smooth upgrades from older database prototypes.
  - **Safe Non-Destructive Constraints (`NOT VALID`):**
    - Adding standard `CHECK` constraints to pre-existing tables with historical data can fail if legacy rows contain unexpected values.
    - We implemented safe conditional constraint blocks using `NOT VALID`:
      ```sql
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_user_preferences_visibility') THEN
          ALTER TABLE public.user_preferences
            ADD CONSTRAINT chk_user_preferences_visibility
            CHECK (profile_visibility IN ('private', 'friends', 'public'))
            NOT VALID;
        END IF;
      END $$;
      ```
    - `NOT VALID` enforces constraints on all future writes while preserving pre-existing historical records without data loss or table locking.
  - Added `DROP POLICY IF EXISTS ...` before every `CREATE POLICY`.
  - Added `DROP TRIGGER IF EXISTS ...` before every `CREATE TRIGGER`.

### E. Announcement Plan Targeting
- **Correction Applied in `20261031_02_rls_policies.sql`:**
  - Created `public.get_user_plan()` helper resolving caller subscription tier (`'free'`, `'pro'`, `'premium'`).
  - Active announcements with `target = 'all'` are visible to everyone.
  - Announcements with `target = 'pro'` are visible to Pro and Premium members.
  - Announcements with `target = 'premium'` are visible only to Premium members.
  - Administrators can inspect all announcements regardless of target.

### F. Multi-Trigger Coexistence on `auth.users`
- Migration 01 attaches trigger `on_auth_user_created` executing `public.handle_new_user()`.
- Migration 04 attaches trigger `on_auth_user_created_subscription` executing `public.handle_new_user_subscription()`.
- Both execute `AFTER INSERT ON auth.users FOR EACH ROW`. In PostgreSQL, triggers execute alphabetically:
  1. `on_auth_user_created` provisions the profile, preferences, and user role.
  2. `on_auth_user_created_subscription` provisions the initial free subscription.
- Both operations are isolated, handle `ON CONFLICT DO NOTHING`, and coexist without interference.

### G. Avatar Storage Folder Isolation (Old and New Paths)
- **Correction Applied in `20261031_03_storage_buckets.sql`:**
  - The `UPDATE` policy enforces `(storage.foldername(name))[1] = auth.uid()::text` in **both** the `USING` clause (verifying the old file being replaced) and the `WITH CHECK` clause (verifying the new file being written).
  - Users cannot update another user's avatar, nor can they move an existing avatar into an unauthorized folder.

---

## 3. Comprehensive Security Matrix

| Feature / Table | Read Access (SELECT) | Write Access (INSERT / UPDATE) | Delete Access (DELETE) | Security Evaluation |
| :--- | :--- | :--- | :--- | :--- |
| **`profiles`** | Owner, Admin, or Public if `is_profile_public() = true` | Owner only (`auth.uid() = id`) | Owner only (Cascade via `auth.users`) | **Isolated & Private** |
| **`user_preferences`** | Owner (`auth.uid() = user_id`) & Admin only | Owner only (`auth.uid() = user_id`) | Owner only | **Zero Public Leakage** |
| **`user_roles`** | Owner (`auth.uid() = user_id`) & Admin | Platform Admin only (`public.is_admin()`) | Platform Admin only | **Privilege Escalation Blocked** |
| **`movies` (Catalog)** | Public (`true`) | Service Role (Server TMDB proxy) & Admin | Platform Admin only | **Tamper-Proof Shared Cache** |
| **`user_movies` (Vault)** | Owner, Admin, or Public if `is_watchlist_public() = true` | Owner only (`auth.uid() = user_id`) | Owner only (`auth.uid() = user_id`) | **Strict Vault Isolation** |
| **`collections`** | Owner, Admin, or Public if `is_public = true` | Owner only (`auth.uid() = user_id`) | Owner only (`auth.uid() = user_id`) | **Strict Shelf Isolation** |
| **`collection_movies`** | Public if parent collection is public; else Owner/Admin | Owner only (Enforces `collections.user_id = auth.uid()`) | Owner only (Enforces `collections.user_id = auth.uid()`) | **Nested Ownership Verified** |
| **`movie_activities`** | Owner, Admin, or Public if `is_activity_public() = true` | Owner only (`auth.uid() = user_id`) | Owner only (`auth.uid() = user_id`) | **Journey History Isolated** |
| **`admin_feature_flags`** | Ordinary users: `enabled = true` only. Admin: all flags. | Platform Admin only (`public.is_admin()`) | Platform Admin only | **Unreleased Features Hidden** |
| **`admin_announcements`** | Active announcements matching user plan (`target`), or Admin | Platform Admin only (`public.is_admin()`) | Platform Admin only | **Plan Targeted** |
| **`admin_spotlight`** | Public if `is_active = true`, or Admin | Platform Admin only (`public.is_admin()`) | Platform Admin only | **Curated Admin Content** |
| **`admin_moderation`** | Platform Admin only | Platform Admin only | Platform Admin only | **Internal Admin Queue** |
| **`admin_audit_logs`** | Platform Admin only | Platform Admin only | Platform Admin only | **Tamper-Resistant Log** |
| **`user_subscriptions`** | Owner (`auth.uid() = user_id`) & Admin | Service Role (Stripe Webhook API) & Admin only | Platform Admin only | **Self-Escalation Blocked** |
| **`storage.objects` (Avatars)** | Public (`bucket_id = 'avatars'`) | Owner only (`folder = auth.uid()::text`) | Owner only (`folder = auth.uid()::text`) | **Path Traversal Defended** |

---

## 4. Verification & Validation Summary

### Executed Checks:
1. **Static AST & Token Validation:**
   - Evaluated dollar-quoting (`$$`) balance: All 4 files have matching pairs with zero unclosed function bodies.
   - Evaluated policy-drop symmetry: Every `CREATE POLICY` is preceded by an idempotent `DROP POLICY IF EXISTS`.
   - Evaluated trigger-drop symmetry: Every `CREATE TRIGGER` is preceded by an idempotent `DROP TRIGGER IF EXISTS`.
2. **Hardened Admin Signature Audit:**
   - Validated that `is_admin()` takes zero arguments across all policies and triggers.
   - Confirmed `DROP FUNCTION IF EXISTS public.is_admin(UUID);` drops the legacy signature.
3. **TypeScript Compilation:**
   - Ran `npx tsc --noEmit`: 0 errors. Application types remain fully aligned with the schema.

### Explicit Non-Execution Notice:
- **No live database was connected, modified, or migrated.**
- All validation performed was purely static, architectural, and compiler-driven.

---

## 5. Recommended Execution Order

Execute the migration files sequentially in your Supabase SQL Editor or via Supabase CLI:

```text
1. 20261031_01_initial_schema.sql
   ├─ Installs extensions (uuid-ossp, pgcrypto).
   ├─ Creates tables, indexes, and existing-table upgrade columns.
   ├─ Applies safe NOT VALID constraints.
   ├─ Attaches set_updated_at triggers.
   └─ Provisions handle_new_user() signup trigger.

2. 20261031_02_rls_policies.sql
   ├─ Drops legacy is_admin(UUID) and creates zero-parameter is_admin().
   ├─ Creates SECURITY DEFINER privacy helpers (is_profile_public, is_watchlist_public, is_activity_public, get_user_plan).
   ├─ Enables RLS across all 13 application tables.
   └─ Applies hardened policies (metadata write restrictions, feature flag privacy, announcement targeting).

3. 20261031_03_storage_buckets.sql
   ├─ Configures the public 'avatars' bucket (5 MB limit, image MIME types).
   └─ Applies user-folder storage policies with dual USING and WITH CHECK ownership validation.

4. 20261031_04_subscriptions.sql
   ├─ Creates user_subscriptions with upgrade columns and safe NOT VALID constraints.
   ├─ Attaches handle_new_user_subscription() signup trigger.
   ├─ Safely backfills existing users with free active subscriptions.
   └─ Applies client-immutable RLS policies (write access restricted to service-role / admin).
```

---

## 6. Remaining Risks & Architectural Next Steps

1. **Client-Side Movie Cataloging Workflow:**
   - With client writes removed from `public.movies`, an authenticated non-admin client cannot directly execute `supabase.from("movies").upsert(...)`.
   - **Recommended Next Step:** Create a lightweight server API endpoint (`/api/movies/cache`) using the Supabase server-side service-role client. When a user adds a film that does not yet exist in `public.movies`, this endpoint caches the TMDB record securely without exposing the service-role key or opening direct table writes to clients.
2. **Friends Social System:**
   - `profile_visibility = 'friends'` remains securely treated as private. When you decide to implement social connections, a dedicated `user_friendships` table migration can be deployed without modifying core profile RLS architecture.
3. **Stripe Webhook Handlers:**
   - Full automated tier management requires implementing `/api/webhooks/stripe` with cryptographic signature verification (`stripe.webhooks.constructEvent()`) updating `user_subscriptions` via the server-side service-role client.

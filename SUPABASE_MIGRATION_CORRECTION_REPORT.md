# CINEASTE — Supabase SQL Migration Final Correction Report

**Product:** Cineaste — Your Second Brain for Movies  
**Project Path:** `D:\CINEASTE-INDEPENDENT`  
**Date:** October 31, 2026  
**Status:** Statically Audited & Corrected (Awaiting Live Staging Test)  
**Production Readiness:** **NOT DECLARED PRODUCTION-READY** until validated against a real Supabase instance.  

---

## 1. Summary of Changes Across Migration Files

### 1. `supabase/migrations/20261031_01_initial_schema.sql`
- **Complete Existing-Table Upgrades:** Added comprehensive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` statements for every table:
  - `profiles`: Added `username`, `display_name`, `avatar_url`, `bio`, `member_since`, `preferred_genres`, `region`, `language`, `created_at`, `updated_at`.
  - `user_preferences`: All 15 columns with defaults.
  - `user_roles`: `role`, `created_at`.
  - `movies`: `media_type`, `title`, `original_title`, `overview`, `poster_path`, `backdrop_path`, `release_date`, `runtime`, `vote_average`, `vote_count`, `genres`, `metadata_updated_at`.
  - `user_movies`: `status`, `is_favorite`, `personal_rating`, `review`, `watched_date`, `added_at`, `updated_at`.
  - `collections`: `name`, `description`, `color`, `is_public`, `cover_url`, `created_at`, `updated_at`.
  - `collection_movies`: `position`, `added_at`.
  - `movie_activities`: `activity_type`, `occurred_at`, `metadata`, `created_at`.
  - Admin tables: all supplementary columns for spotlight, announcements, feature flags, moderation, and audit logs.
- **Safe Non-Destructive Constraints (`NOT VALID`):**
  - Added constraints conditionally inside `DO $$ BEGIN IF NOT EXISTS ... END $$;` with `NOT VALID`.
  - Guarantees that pre-existing historical rows with dirty/legacy values do not fail migrations or get deleted.
- **Trigger Security:**
  - Added `REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;` and granted strictly to `postgres, service_role`.
  - Maintained `SET search_path = public, pg_temp`.

### 2. `supabase/migrations/20261031_02_rls_policies.sql`
- **Strict Dependency Ordering:**
  - Positioned all `DROP POLICY IF EXISTS ...` statements at the very beginning of the migration.
  - Ensures that all legacy policies that referenced `public.is_admin(UUID)` are removed **before** attempting to drop the function.
  - Safely drops the legacy function via `DROP FUNCTION IF EXISTS public.is_admin(UUID);` **without `CASCADE`**.
- **Hardened Zero-Argument Admin Helper:**
  - `public.is_admin()` evaluates `auth.uid()` internally from the caller's JWT.
  - Callers cannot probe arbitrary user IDs.
- **Dynamic Subscription Plan Helper (`public.get_user_plan()`):**
  - Uses `to_regclass('public.user_subscriptions')` to safely return `'free'` if executed on a fresh database before Migration 04.
  - Evaluates subscription lifecycle:
    1. `active` or `trialing`: Grants current paid plan.
    2. `canceled`: Preserves paid plan **if and only if** `current_period_end > now()`.
    3. `past_due` or expired: Safely falls back to `'free'`.
  - Granted execution to `authenticated, anon` for announcement RLS evaluation.
- **Shared Movie Catalog Write Restriction:**
  - Client-side `INSERT`/`UPDATE` removed.
  - Writes restricted to `public.is_admin()` and server-side processes with Supabase `service_role`.
- **Feature Flag Protection:**
  - Ordinary users can only read flags where `enabled = true`.
  - Admins can inspect all flags.

### 3. `supabase/migrations/20261031_03_storage_buckets.sql`
- **Avatar Storage Dual Ownership Check:**
  - Preserved public read on `avatars`.
  - Enforced `(storage.foldername(name))[1] = auth.uid()::text` in both `USING` and `WITH CHECK` during avatar updates.

### 4. `supabase/migrations/20261031_04_subscriptions.sql`
- **Complete Existing-Table Upgrades:**
  - Added `ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS ...` for all columns including `created_at`.
  - Safe `NOT VALID` constraints on `plan` and `status`.
- **Execution Lockdown on Trigger Function:**
  - `REVOKE EXECUTE ON FUNCTION public.handle_new_user_subscription() FROM PUBLIC;`
  - Granted strictly to `postgres, service_role`.
- **Static Subscription Plan Helper:**
  - Re-declared direct static query for `public.get_user_plan()` now that `public.user_subscriptions` is guaranteed to exist.
- **Self-Escalation Block:**
  - Ordinary users have `SELECT` only on their own subscription row (`auth.uid() = user_id`).
  - Writes restricted to `public.is_admin()` and service role (Stripe webhooks).

---

## 2. Subscription Lifecycle Policy & Assumptions

| Subscription Status | Database Fields | Evaluated Plan | Rationale & Policy |
| :--- | :--- | :--- | :--- |
| **`active`** | `plan = 'pro' \| 'premium'` | `plan` | Active, paid subscription in good standing. |
| **`trialing`** | `plan = 'pro' \| 'premium'` | `plan` | Active trial authorized by Stripe. |
| **`canceled`** (In Period) | `current_period_end > now()` | `plan` | User canceled auto-renew, but paid through end of cycle. Access preserved. |
| **`canceled`** (Expired) | `current_period_end <= now()` | `'free'` | Billing cycle concluded; reverts to free tier. |
| **`past_due`** | Payment failed | `'free'` | Reverts to free tier pending successful payment retry. |

> [!NOTE]
> **Product Owner Confirmation Required:** If Cineaste wishes to grant a temporary grace period for `past_due` accounts (e.g., 3-5 days of Stripe Smart Retries before downgrading to free), `public.get_user_plan()` can be updated to check `current_period_end + interval '3 days'`. Currently, it reverts immediately to `'free'` to prevent unpaid access.

---

## 3. Static Validation vs. Live Testing Distinction

### Statically Verified (Executed):
- **AST / Grammar & Token Balance:** All `$$` function body quotes match; all parenthesis pairs match.
- **Dependency Flow:** Policies dropped before function drop; zero `CASCADE` shortcuts.
- **Function Signature:** Every policy call to `is_admin` uses zero parameters (`public.is_admin()`).
- **TypeScript Integrity:** `npx tsc --noEmit` verified 0 errors across the Next.js application.

### NOT Executed (Requires Real Staging Project):
- **Live PostgreSQL Execution:** No SQL was executed against a live Supabase or PostgreSQL database.
- **Live Trigger Execution:** `handle_new_user()` and `handle_new_user_subscription()` have not been executed by GoTrue in a live test environment.
- **Live Storage Quota & MIME Checks:** `storage.buckets` configuration has not been validated against live Supabase Storage API.

---

## 4. Recommended Staging Execution Steps

When ready to test on a staging or preview Supabase database, execute in this exact sequence:

1. `20261031_01_initial_schema.sql`
2. `20261031_02_rls_policies.sql`
3. `20261031_03_storage_buckets.sql`
4. `20261031_04_subscriptions.sql`

All four files are idempotent and non-destructive.

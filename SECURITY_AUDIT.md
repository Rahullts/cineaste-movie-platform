# CINEASTE — Comprehensive Security & Row Level Security (RLS) Audit

This document details the multi-tenant security architecture, Row Level Security (RLS) policies, administrative authorization, and API boundary protections in Cineaste.

---

## 1. Threat Model & Principles

1. **Strict Tenant Isolation**: No user can read, create, modify, or delete another user's private watchlist, ratings, reviews, timeline journey, preferences, or private collections.
2. **Untrusted Client Boundary**: Never trust role headers or client assertions sent from the browser. Client tokens cannot promote their own role or grant themselves Pro/Premium subscriptions.
3. **Admin Verification via Security Definer Function**: Administrative privileges are verified directly against `public.user_roles` using PostgreSQL functions running with elevated definer security (`SECURITY DEFINER`), immune to client tampering.
4. **Service Role Seclusion**: The `SUPABASE_SERVICE_ROLE_KEY` is restricted exclusively to Next.js server runtime (`src/lib/supabase/server.ts`) and is never included in any client bundle.

---

## 2. Row Level Security (RLS) Policy Matrix

Row Level Security is enabled on **100% of Cineaste database tables**.

| Table | Operation | Enforced RLS Policy | Security Justification |
| :--- | :--- | :--- | :--- |
| `profiles` | `SELECT` | `true` (Public profiles enabled) | Allows users to share public profile links. |
| `profiles` | `UPDATE` | `auth.uid() = id OR is_admin(auth.uid())` | Users can only modify their own profile data. |
| `user_preferences` | `SELECT` | `auth.uid() = user_id OR is_admin(auth.uid())` | Personal UI preferences and email alerts remain private. |
| `user_preferences` | `INSERT / UPDATE` | `auth.uid() = user_id` | Users can only configure their own settings. |
| `user_roles` | `SELECT` | `auth.uid() = user_id OR is_admin(auth.uid())` | Prevents discovery of administrator roster. |
| `user_roles` | `INSERT / UPDATE / DELETE` | `is_admin(auth.uid())` | Users cannot escalate their own privileges. |
| `movies` | `SELECT` | `true` | Shared global film catalog readable by all. |
| `movies` | `INSERT / UPDATE` | `auth.role() = 'authenticated'` | Authenticated users cache new TMDB records into catalog. |
| `user_movies` | `SELECT` | `auth.uid() = user_id OR is_admin(auth.uid())` | User library entries are completely isolated per account. |
| `user_movies` | `INSERT / UPDATE / DELETE` | `auth.uid() = user_id` | Enforces ownership on all status and rating changes. |
| `collections` | `SELECT` | `auth.uid() = user_id OR is_public = true OR is_admin(auth.uid())` | Private collections isolated; public collections viewable. |
| `collections` | `INSERT / UPDATE / DELETE` | `auth.uid() = user_id` | Only collection owner can rename, edit, or delete. |
| `collection_movies` | `SELECT` | Owner of collection OR `is_public = true` | Inherits parent collection visibility. |
| `collection_movies` | `INSERT / UPDATE / DELETE` | Owner of parent collection | Only owner can add or remove films from collections. |
| `movie_activities` | `SELECT` | `auth.uid() = user_id OR is_admin(auth.uid())` | Timeline history remains strictly confidential to user. |
| `movie_activities` | `INSERT / UPDATE / DELETE` | `auth.uid() = user_id` | Activity journey events belong strictly to the creator. |
| `user_subscriptions` | `SELECT` | `auth.uid() = user_id OR is_admin(auth.uid())` | Users can inspect their current plan and renewal dates. |
| `user_subscriptions` | `ALL (Mutation)` | `is_admin(auth.uid())` | Subscription upgrades require backend webhook / service role. |
| `admin_*` tables | `ALL` | `is_admin(auth.uid())` | Moderation, audit logs, feature flags, and spotlights restricted to admins. |

---

## 3. Administrator Authorization Flow

Administrative security is validated through two independent layers:

### Layer A: PostgreSQL Function (`public.is_admin`)
```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = user_uid AND role = 'admin'
  );
$$;
```
This function executes with database definer privileges, checking the isolated `user_roles` table. Standard users cannot manipulate its return value.

### Layer B: Server-Side API Verification (`/api/admin/action` & `/api/admin/metrics`)
When an administrative action is triggered (e.g. toggling a feature flag, moderating content, or refreshing metrics):
1. The route executes on the server in Next.js App Router (`src/app/api/admin/*`).
2. It extracts the session cookie via `createClient()`.
3. If no session is found, it returns `HTTP 401 Unauthorized`.
4. It calls `createAdminClient()` to query `user_roles` for the authenticated `user.id`.
5. If the role is not `'admin'`, it returns `HTTP 403 Forbidden` and terminates.
6. If verified, it executes the action and creates a tamper-proof entry in `admin_audit_logs`.

---

## 4. Supabase Storage Bucket Security

Avatar image uploads are governed by storage-level policies in `supabase/migrations/20261031_03_storage_buckets.sql`:

```sql
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

- Each user can only write into their own folder: `avatars/{auth.uid()}/*`.
- Overwriting another user's avatar image is blocked at the storage layer.
- File deletion and updates require matching the prefix to `auth.uid()`.

---

## 5. Stripe & Subscription Security

- Client-side checkout pages or buttons cannot write directly to `public.user_subscriptions`.
- Upgrades and cancellations are handled exclusively via Stripe Webhooks calling the Supabase Admin / Service Role client.
- Even if a user attempts a direct REST/GraphQL `UPDATE` to change `plan = 'premium'`, the RLS policy:
  ```sql
  CREATE POLICY "Only service role or admin can manage subscriptions"
    ON public.user_subscriptions FOR ALL
    USING (public.is_admin(auth.uid()))
  ```
  will reject the transaction with permission denied.

---

## 6. Audit & Hardening Summary

- [x] **No hardcoded secrets**: All API keys use `process.env` configuration.
- [x] **Service role key isolated**: Guarded inside `src/lib/supabase/server.ts`, never imported into any client component (`"use client"`).
- [x] **Injection immune**: All database interactions use parameterized PostgREST ORM calls.
- [x] **Zero UI breakage**: Unauthenticated visitors retain full browsing, discover, and local archiving capabilities without disruptions.

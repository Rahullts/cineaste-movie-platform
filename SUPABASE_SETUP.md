# CINEASTE — Supabase Setup & Installation Guide

This guide walks you through connecting your Cineaste application to Supabase (PostgreSQL, Supabase Auth, Storage, and Row Level Security).

---

## 1. Create a Supabase Project

1. Log in to [Supabase Console](https://supabase.com/dashboard).
2. Click **New Project**.
3. Choose your organization, enter a name (e.g., `cineaste-production`), and generate a strong database password (store this safely).
4. Select a region close to your users (e.g. `ap-south-1` for Mumbai/India or `us-east-1` for US East).
5. Click **Create new project** and wait ~2 minutes for provisioning to finish.

---

## 2. Retrieve API Keys & Credentials

1. In the Supabase project dashboard, navigate to **Project Settings** (gear icon) -> **API**.
2. Copy the following keys:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **Project API Keys -> `anon` / `public`** (starts with `ey...`)
   - **Project API Keys -> `service_role` / `secret`** (starts with `ey...`)

> [!WARNING]
> Keep your **Service Role Key** secret! It bypasses Row Level Security. Only put it in `.env.local` for server-side API routes. Never expose it in browser components or public git repositories.

---

## 3. Configure Environment Variables

Open or create `d:\CINEASTE-INDEPENDENT\.env.local` and add:

```env
# TMDB API (Existing)
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
NEXT_PUBLIC_TMDB_ACCESS_TOKEN=your_tmdb_access_token_here

# Supabase Public Keys (Accessible to Client & Server)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...your_anon_key_here

# Supabase Server-Only Secret (Used only in /api/admin and SSR)
SUPABASE_SERVICE_ROLE_KEY=ey...your_service_role_key_here
```

---

## 4. Run SQL Migrations in Order

Navigate to the **SQL Editor** tab in your Supabase dashboard. Open a **New Query** for each of the four migration files located in `supabase/migrations/` and run them sequentially:

### Migration 1: Base Tables & Triggers
File: `supabase/migrations/20261031_01_initial_schema.sql`
- Creates `profiles`, `user_preferences`, `user_roles`, `movies`, `user_movies`, `collections`, `collection_movies`, `movie_activities`, and `admin_*` tables.
- Installs the `handle_new_user()` trigger that automatically creates a profile and preferences record whenever a user signs up.

### Migration 2: Row Level Security (RLS)
File: `supabase/migrations/20261031_02_rls_policies.sql`
- Enables RLS on all tables.
- Creates `public.is_admin(user_uid)` security definer function.
- Enforces strict user isolation (`auth.uid() = user_id`).

### Migration 3: Storage Buckets
File: `supabase/migrations/20261031_03_storage_buckets.sql`
- Creates the public `avatars` storage bucket.
- Configures RLS policies allowing authenticated users to upload and edit avatars within their own user folder (`{user_id}/*`).

### Migration 4: Subscriptions & Billing
File: `supabase/migrations/20261031_04_subscriptions.sql`
- Creates `user_subscriptions` table.
- Grants read access to users for their own tier, but restricts updates strictly to administrators or service role webhooks (preventing unauthorized client-side tier tampering).

---

## 5. Provision Your First Administrator Account

1. Start your local Cineaste app (`npm run dev`).
2. Click **Sign In** in the top navigation bar.
3. Switch to **Sign Up** and create your primary account with your email and password.
4. Go to the Supabase **SQL Editor** and run:

```sql
-- Grant Admin role to your user account
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';
```

5. Refresh your Cineaste browser window. You will now have full access to `/admin` and elevated system management features.

---

## 6. Verification Checklist

- [ ] **Auth Modal**: Click *Sign In* in the top navigation; modal opens smoothly.
- [ ] **Sign In / Sign Up**: Able to authenticate; user avatar and name appear in top right.
- [ ] **Automatic Data Migration**: Any existing movies, collections, or timeline entries from your browser's localStorage are seamlessly uploaded to Supabase on first login.
- [ ] **Profile Avatar Upload**: Go to `/profile`, upload a new avatar image, and verify it persists into the `avatars` Supabase Storage bucket.
- [ ] **Admin Metrics**: Navigate to `/admin` with your admin account; database counts load directly from PostgreSQL.
- [ ] **Offline / Fallback Resilience**: If `.env.local` is missing or Supabase is unreachable, Cineaste automatically falls back to localStorage with zero crashes.

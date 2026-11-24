# CINEASTE — Data Migration & Synchronization Guide

This document describes how Cineaste transitions data from browser `localStorage` to your persistent Supabase PostgreSQL cloud backend.

---

## 1. Migration Architecture & Overview

Before this migration, Cineaste maintained user data in client-side storage keys:
- `cineaste:library:movies`: Stored all saved, watching, and watched movies.
- `cineaste:library:collections`: Stored user collections.
- `cineaste:library:activities`: Stored timeline journey events.
- `cineaste:profile`: Stored bio, preferences, genres, and settings.
- `cineaste:account:role`: Stored local test role.

### Automatic First-Login Migration
When a user signs up or signs in for the first time with Supabase configured:
1. `UserContext` detects an active session and checks `localStorage.getItem("cineaste:migrated:<user_id>")`.
2. If this key does not exist, `MigrationService.migrateFromLocalStorage(userId)` executes automatically in the background.
3. A local snapshot backup is created immediately before touching any cloud records.
4. Data is mapped to the relational schema and committed via idempotent PostgreSQL upserts.
5. The completion key `cineaste:migrated:<user_id>` is set.
6. A toast notification informs the user: *"Cloud Sync Complete — Your local archive has been safely synced to your account."*

---

## 2. Safety First: The Snapshot Backup Mechanism

Before migrating a single record, `MigrationService` archives the entire existing localStorage state into an immutable backup key:

```ts
const backupKey = `cineaste:backup:${Date.now()}`;
localStorage.setItem(backupKey, JSON.stringify({
  movies: localMovies,
  collections: localCollections,
  activities: localActivities,
  profile: localProfile,
  timestamp: new Date().toISOString()
}));
```

If anything fails or a user wants to audit their pre-cloud archive, the backup remains in `localStorage` under `cineaste:backup:<timestamp>`.

---

## 3. Relational Schema Mapping

| Local Storage Concept | Relational PostgreSQL Target | Unique / Conflict Key |
| :--- | :--- | :--- |
| Movie metadata (title, poster, genres, TMDB ID) | `public.movies` | `tmdb_id` (upserted without duplicates) |
| User library status (want, watching, watched, rating) | `public.user_movies` | `(user_id, movie_id)` |
| Collections (name, color, description, is_public) | `public.collections` | `id` (UUID generated if missing) |
| Items inside collection | `public.collection_movies` | `(collection_id, movie_id)` |
| Cinema timeline logs (viewed, added, watched) | `public.movie_activities` | `id` |
| Settings & preferences | `public.user_preferences` | `user_id` |
| Bio & avatar | `public.profiles` | `id` |

---

## 4. Conflict Resolution Strategy

- **Movies**: Deduplicated globally on `tmdb_id`. If two users save *Inception*, only one row exists in `public.movies`, with two independent reference rows in `public.user_movies`.
- **User Library**: Conflicts resolved using PostgreSQL `ON CONFLICT (user_id, movie_id) DO UPDATE`. Cloud status takes precedence unless local change timestamp is newer.
- **Collections**: Existing collections are imported retaining their names and assigned movie links.
- **Idempotency**: Re-running migration will never create duplicate movie cards or duplicate timeline activities.

---

## 5. Offline & Unauthenticated Fallback Mechanism

Cineaste is engineered with a **zero-lockout fallback philosophy**:

1. **Unconfigured Supabase**: If `NEXT_PUBLIC_SUPABASE_URL` is omitted, blank, or unreachable, `isSupabaseConfigured` evaluates to `false`.
2. **Unauthenticated Browsing**: If a user is not logged in, `LibraryRepository` seamlessly redirects all reads and writes to `localStorage`.
3. **Graceful Network Degradation**: If a cloud write fails, Cineaste persists the change locally and logs a non-blocking warning, keeping the UI fully interactive.

---

## 6. Manual Rollback / Disaster Recovery

If you ever need to restore from a local backup:

1. Open your browser DevTools Console (`F12`).
2. Run:
```javascript
// Find your backup key
const keys = Object.keys(localStorage).filter(k => k.startsWith('cineaste:backup:'));
console.log('Available backups:', keys);

// Restore the latest backup
const latest = keys.sort().pop();
const backup = JSON.parse(localStorage.getItem(latest));

localStorage.setItem('cineaste:library:movies', JSON.stringify(backup.movies));
localStorage.setItem('cineaste:library:collections', JSON.stringify(backup.collections));
localStorage.setItem('cineaste:library:activities', JSON.stringify(backup.activities));
localStorage.setItem('cineaste:profile', JSON.stringify(backup.profile));

window.location.reload();
```

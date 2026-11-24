# CINEASTE — Backend API Gateway & Endpoint Documentation

**Document:** `CINEASTE_API_DOCUMENTATION.md`  
**Project Path:** `D:\CINEASTE-INDEPENDENT`  
**Base URL:** `http://localhost:3000`  
**Date:** November 12, 2026  
**Author:** Senior API Integration Engineer & Backend Architect  

---

## 1. Overview & Architecture

Cineaste utilizes Next.js Route Handlers to provide a secure, server-side gateway for movie metadata discovery, image asset delivery, OAuth authentication callbacks, and administrative governance:

1. **Client Isolation:** Client components never directly hold upstream API keys or service role secrets.
2. **Resilience & Zero-500 Guarantee:** Endpoints incorporate in-memory caching and multi-tier fallbacks to prevent user-facing downtime.
3. **Strict Authorization:** Privileged endpoints verify session cookies and database roles server-side before execution.

---

## 2. API Endpoints Reference

### 1. `POST /api/tmdb` — Movie Discovery & Metadata Gateway

Universal server-side gateway handling all TMDB queries, searches, credits, and AI vibe queries.

- **Method:** `POST`
- **Authentication:** Public
- **Headers:** `Content-Type: application/json`
- **Caching:** 15-minute in-memory cache keyed by request payload.

#### Supported Actions

| Action | Required Payload Parameters | Description |
| :--- | :--- | :--- |
| `trending` | `{ action: "trending", window: "day" \| "week", page?: number }` | Fetches trending cinema worldwide. |
| `search` | `{ action: "search", query: string, page?: number }` | Searches movie titles, overviews, and keywords. |
| `details` / `detail` | `{ action: "details", id: number }` | Returns movie metadata, runtime, genres, director, and top cast credits. |
| `recommendations` | `{ action: "recommendations", id: number }` | Fetches personalized TMDB recommendations based on a reference movie ID. |
| `discover` | `{ action: "discover", with_original_language?: string, sort_by?: string, page?: number }` | Curated discovery filters (e.g. `ta\|te\|ml\|kn` for South Indian, `hi` for Hindi). |
| `genres` | `{ action: "genres" }` | Returns standard TMDB genre taxonomy. |
| `trendingPeople` | `{ action: "trendingPeople", window?: "day" \| "week" }` | Fetches trending actors and directors. |
| `ai_search` | `{ action: "ai_search", query: string }` | Semantic vibe search matching mood, pacing, and genre keywords. |

#### Example Request: Discover Tamil Cinema
```json
{
  "action": "discover",
  "with_original_language": "ta",
  "sort_by": "popularity.desc",
  "page": 1
}
```

#### Example Response (200 OK)
```json
{
  "page": 1,
  "total_pages": 42,
  "total_results": 840,
  "results": [
    {
      "id": 1159501,
      "tmdb_id": 1159501,
      "title": "Meiyazhagan",
      "original_title": "மெய்யழகன்",
      "overview": "A man in his forties returns to his native village after 22 years...",
      "poster_path": "/bE59H7x16O7k1k18H1tJ76.jpg",
      "backdrop_path": "/xO9uH4tT6k3k5L5m8O0.jpg",
      "release_date": "2024-09-27",
      "vote_average": 8.2,
      "vote_count": 86,
      "genre_ids": [18]
    }
  ]
}
```

---

### 2. `GET /api/image` — Multi-Tier TMDB Image CDN Proxy

Optimized image delivery endpoint that eliminates ISP DNS blocking and CDN rate-limits.

- **Method:** `GET`
- **Authentication:** Public
- **Query Parameters:**
  - `path` (string, required): TMDB image path (e.g. `/xSDoxv4pHvs4xZjvTb0Iqg1A6ro.jpg`).
  - `w` (string, optional): Width dimension (`w500`, `w780`, `w1280`, or `original`). Default: `w1280`.

#### Resolution Hierarchy
1. **Tier 1:** Direct fetch from TMDB CDN (`https://image.tmdb.org/t/p/...`) with browser User-Agent headers (4-second timeout).
2. **Tier 2:** Fallback to global image proxy `wsrv.nl` if direct TMDB fetch fails or times out.
3. **Tier 3:** Neutral dark cinematic SVG placeholder (`image/svg+xml`) if all upstream networks are unreachable.

#### Response Headers
- `Content-Type: image/jpeg` (or matching upstream format)
- `Cache-Control: public, max-age=604800, immutable` (7 days browser cache)

---

### 3. `GET /auth/callback` — Supabase OAuth & PKCE Handler

Processes authorization callbacks from third-party identity providers (e.g. Google OAuth).

- **Method:** `GET`
- **Query Parameters:**
  - `code` (string, required): Authorization code issued by identity provider.
  - `next` (string, optional): Destination URL after authentication (default `/dashboard`).
- **Behavior:** Calls `supabase.auth.exchangeCodeForSession(code)` on the server, sets session cookies, and redirects the user.

---

### 4. `POST /api/admin/action` — Protected Platform Administration

Processes administrative operations. Protected with dual-layer authentication and database role verification.

- **Method:** `POST`
- **Authentication:** Required (User must have `user_roles.role = 'admin'`).
- **Headers:** `Content-Type: application/json`

#### Supported Actions

```json
// Update User Role
{
  "action": "update_role",
  "payload": {
    "targetUserId": "uuid-here",
    "newRole": "admin"
  }
}

// Publish System Announcement
{
  "action": "publish_announcement",
  "payload": {
    "title": "Platform Maintenance Scheduled",
    "body": "Cineaste will undergo 15 minutes of routine maintenance tonight.",
    "type": "info",
    "target": "all"
  }
}

// Toggle Feature Flag
{
  "action": "toggle_feature_flag",
  "payload": {
    "key": "ai_vibe_search",
    "enabled": true
  }
}
```

#### Security Enforcements
- Returns `401 Unauthorized` if session cookie is absent or expired.
- Returns `403 Forbidden` if caller's role in `public.user_roles` is not `'admin'`.
- Automatically logs all actions to `public.admin_audit_logs`.

---

### 5. `GET /api/admin/metrics` — Live System Health & Telemetry

Returns verified database counts and recent administrative audit logs.

- **Method:** `GET`
- **Authentication:** Required (Admin only).

#### Example Response (200 OK)
```json
{
  "success": true,
  "metrics": {
    "totalRegisteredUsers": 12,
    "totalCatalogMovies": 84,
    "totalSavedFilms": 142,
    "totalCollections": 9,
    "totalActivities": 312,
    "recentAuditLogs": [
      {
        "id": "e0b5c1...",
        "action": "update_role",
        "target_type": "user",
        "created_at": "2026-11-12T16:40:00Z"
      }
    ]
  }
}
```

# Cineaste — Existing Website Inspection Report

**Target Workspace:** `d:\CINEASTE-INDEPENDENT`  
**Inspected Production Site:** [https://eminent-cine-vault-flow.base44.app](https://eminent-cine-vault-flow.base44.app)  
**Target Repository (Protected):** [https://github.com/Rahullts/cineaste-movie-platform](https://github.com/Rahullts/cineaste-movie-platform)  
**Inspection Date:** October 2026

---

## 1. Executive Summary & Objective

This report captures the complete reverse-engineering and architecture inspection of the published Base44 Cineaste movie discovery and tracking platform. Cineaste is an editorial, cinema-focused "Second Brain for Movies" that unifies movie discovery, AI-driven mood/vibe exploration, Letterboxd diary migration, personal watchlists, custom curated collections, and viewing timeline analytics.

The objective of this project is a **100% independent reconstruction** of Cineaste inside the dedicated workspace `d:\CINEASTE-INDEPENDENT`. The reconstruction will preserve the exact design identity, visual tokens, layouts, features, and workflows while rebuilding the system with modern, maintainable open-source standards (Next.js 15 / React 19, Tailwind CSS, Supabase PostgreSQL with RLS, Serverless TMDB API proxy, and Gemini AI).

---

## 2. Brand Identity & Design System Tokens

Inspection of the compiled production stylesheet (`assets/index-XuFztMFu.css`) extracted the exact design tokens, CSS variables, and typography rules governing the Cineaste interface. The platform operates primarily in a signature **editorial dark cinema** mode, with high-contrast emerald green accents and gold star rating highlights.

### 2.1 CSS Custom Properties (Dark Theme — Primary)

```css
.dark {
  --background: 240 12% 5%;           /* #0A0B0F - Deep Obsidian Canvas */
  --foreground: 240 8% 96%;           /* #F3F4F6 - Crisp Off-White Text */
  --card: 240 10% 7%;                 /* #101118 - Elevated Surface Layer */
  --card-foreground: 240 8% 96%;      /* #F3F4F6 */
  --popover: 240 10% 8%;              /* #12131C - Flyouts and Modals */
  --popover-foreground: 240 8% 96%;   /* #F3F4F6 */
  --primary: 152 90% 52%;             /* #00D664 - Cineaste Emerald Accent */
  --primary-foreground: 0 0% 100%;    /* #FFFFFF - Pure White on Emerald */
  --secondary: 240 6% 12%;            /* #181820 - Secondary Button / Tab Surface */
  --secondary-foreground: 240 8% 96%; /* #F3F4F6 */
  --muted: 240 6% 12%;                /* #181820 - Disabled / Subdued Background */
  --muted-foreground: 240 5% 62%;     /* #9496A1 - Metadata, Dates, Subtitles */
  --accent: 240 6% 15%;               /* #22232D - Hover State Surface */
  --accent-foreground: 240 8% 96%;    /* #F3F4F6 */
  --destructive: 0 72% 55%;           /* #E53935 - Danger / Delete State */
  --destructive-foreground: 0 0% 100%;
  --gold: 41 96% 58%;                 /* #FBBF24 - TMDB Rating & Star Accents */
  --border: 240 6% 16%;               /* #1E1F2A - Hairline Panel Dividers */
  --input: 240 6% 18%;                /* #232532 - Form Inputs & Search Bars */
  --ring: 152 90% 52%;                /* #00D664 - Focus Ring Accent */
  --radius: 0.85rem;                  /* 13.6px - Rounded XL Corner Geometry */

  /* Sidebar Specific Tokens */
  --sidebar-background: 240 12% 6%;   /* #0D0E14 - Persistent Sidebar Nav */
  --sidebar-foreground: 240 8% 96%;
  --sidebar-primary: 152 90% 52%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 240 6% 14%;
  --sidebar-border: 240 6% 16%;
  --sidebar-ring: 152 90% 52%;

  /* Data Visualization & Analytics Charts */
  --chart-1: 152 84% 56%;             /* Emerald */
  --chart-2: 230 86% 72%;             /* Electric Indigo */
  --chart-3: 152 64% 52%;             /* Forest Tint */
  --chart-4: 41 96% 60%;              /* Warm Amber */
  --chart-5: 190 90% 56%;             /* Cyan */
}
```

### 2.2 CSS Custom Properties (Light Theme — Secondary)

```css
:root {
  --background: 30 20% 99%;
  --foreground: 240 10% 8%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 8%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 8%;
  --primary: 152 72% 33%;
  --primary-foreground: 0 0% 100%;
  --secondary: 240 5% 96%;
  --secondary-foreground: 240 10% 12%;
  --muted: 240 5% 95%;
  --muted-foreground: 240 4% 44%;
  --accent: 240 5% 95%;
  --accent-foreground: 240 10% 12%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --gold: 41 96% 52%;
  --border: 240 6% 90%;
  --input: 240 6% 90%;
  --ring: 152 72% 33%;
  --radius: 0.85rem;
}
```

### 2.3 Typography

- **Heading & Display Font:** `"Sora", ui-sans-serif, system-ui, sans-serif`
  - Geometric, high-character aesthetic used for hero titles, section headers, movie titles, and branding.
- **Body & Interface Font:** `"Inter", ui-sans-serif, system-ui, sans-serif`
  - High-legibility neutral sans-serif used for body descriptions, metadata chips, table rows, and form controls.
- **Monospace Font:** `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`
  - Used for technical statistics, runtimes, dates, and keyboard shortcut badges (`⌘K`).

---

## 3. Discovered Application Architecture

Inspection of the bundled JavaScript code (`assets/index-Cj7Dk6LH.js`) identified the following key architectural patterns:

```
+-------------------------------------------------------------------------+
|                              CLIENT UI                                  |
|  - React 18 / 19 SPA + App Shell (Sidebar + TopBar + Mobile Nav)        |
|  - Sora & Inter Typography, Tailwind Theme Variables                    |
|  - Global Command Palette (Cmd+K)                                       |
|  - TanStack Query (React Query) for API Cache & Optimistic Mutations   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+------------------------------------+------------------------------------+
|                         SERVERLESS BACKEND                              |
|  - tmdbProxy: Secure Gateway to The Movie Database (TMDB v3 API)        |
|  - AI Vibe Search: LLM natural-language to TMDB filter translator      |
|  - Letterboxd CSV Parser & Batch TMDB ID Matcher                        |
|  - Supabase PostgreSQL: Profiles, Watchlist, Collections, Activities   |
+-------------------------------------------------------------------------+
```

### 3.1 TMDB Proxy Endpoints & Action Handlers

In the original Base44 application, frontend clients never talk directly to TMDB with client-side API keys. Instead, they invoke a backend proxy function:

```javascript
// Reverse-engineered TMDB proxy client pattern from bundle
const tmdbClient = {
  search: (query, page = 1) => invokeProxy({ action: "search", query, page }),
  trending: (window = "week", page = 1) => invokeProxy({ action: "trending", window, page }),
  discover: (filters) => invokeProxy({ action: "discover", ...filters }),
  genres: () => invokeProxy({ action: "genres" }),
  details: (id) => invokeProxy({ action: "details", id }),
  person: (id) => invokeProxy({ action: "person", id }),
  trendingPeople: (window = "week") => invokeProxy({ action: "trendingPeople", window })
};
```

Artwork is served through the official TMDB CDN (`https://image.tmdb.org/t/p/`) using standard widths: `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, and `original`.

### 3.2 AI Vibe Search Mechanism

The AI search feature translates conversational prompts into structured TMDB discover parameters:

1. **Genre Mapping Table:**
   - 28: Action | 12: Adventure | 16: Animation | 35: Comedy | 80: Crime
   - 99: Documentary | 18: Drama | 10751: Family | 14: Fantasy | 36: History
   - 27: Horror | 10402: Music | 9648: Mystery | 10749: Romance | 878: Sci-Fi
   - 53: Thriller | 10752: War | 37: Western

2. **LLM Translation Target:**
   ```json
   {
     "with_genres": "878,9648",
     "sort_by": "vote_average.desc",
     "from_year": 1990,
     "to_year": 2026,
     "vote_count_gte": 500,
     "interpretation": "Exploring psychological sci-fi mysteries with high ratings."
   }
   ```

### 3.3 Letterboxd Ingestion Engine

Inspection of the Letterboxd parsing module revealed automatic column detection:
- Columns containing `rating` $\rightarrow$ parsed as user star rating (1-5 or 1-10).
- Columns containing `date` $\rightarrow$ parsed as viewing date (`watched_date`).
- Columns containing `position` $\rightarrow$ parsed as watchlist item.
- Columns containing `description` $\rightarrow$ parsed as custom list.
- Rows extract `Name` (title) and `Year` to query TMDB `/search/movie` with title + `year` filtering for exact matching.

---

## 4. Entity Schemas & Database Models

The original Base44 application defined 6 core entities, which map directly to our Supabase PostgreSQL schema:

1. **`Profile` (`profiles`)**:
   - `id` (UUID references `auth.users`), `username`, `full_name`, `avatar_url`, `bio`, `letterboxd_username`, `preferences` (JSONB), `created_at`, `updated_at`.
2. **`WatchlistItem` (`watchlist_items`)**:
   - `id`, `user_id`, `tmdb_id`, `title`, `original_title`, `poster_path`, `backdrop_path`, `overview`, `release_date`, `runtime`, `director`, `genres` (JSONB), `genre_ids` (INTEGER[]), `vote_average`, `trailer_key`, `status` (`want`, `watched`, `watching`, `dropped`), `is_favorite` (BOOLEAN), `rating` (NUMERIC 3,1), `review` (TEXT), `watched_date` (DATE), `watched_at` (TIMESTAMPTZ), `remind_on` (DATE), `sort_order` (INTEGER).
3. **`Collection` (`collections`)**:
   - `id`, `user_id`, `title`, `description`, `cover_url`, `color` (Default `#00D664`), `is_public` (BOOLEAN), `sort_order`, `created_at`, `updated_at`.
4. **`CollectionMovie` (`collection_movies`)**:
   - `id`, `collection_id`, `tmdb_id`, `title`, `poster_path`, `release_date`, `notes` (TEXT), `sort_order`, `created_at`.
5. **`Activity` (`activities`)**:
   - `id`, `user_id`, `type` (`added`, `watched`, `favorited`, `rated`, `reviewed`, `created_collection`), `tmdb_id`, `title`, `poster_path`, `metadata` (JSONB), `occurred_at`.
6. **`CollectionSocial` (`collection_likes`, `collection_comments`)**:
   - Social interactions on shared public collections.

---

## 5. Security & Boundary Guarantees

1. **No Proprietary Backend Code Dependence:** The reconstruction will not attempt to retrieve or reproduce internal Base44 proprietary infrastructure. All endpoints are implemented clean-room using Next.js route handlers and Supabase RLS.
2. **GitHub Repository Isolation:** The existing repository `https://github.com/Rahullts/cineaste-movie-platform` is kept untouched until explicitly directed by the user.
3. **Published Base44 Site Non-Interference:** The live site at `eminent-cine-vault-flow.base44.app` is read-only reference and remains completely operational.

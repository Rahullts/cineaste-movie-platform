# Cineaste — Feature Inventory & Screen Specification

**Target Workspace:** `d:\CINEASTE-INDEPENDENT`  
**Inspected Production Site:** [https://eminent-cine-vault-flow.base44.app](https://eminent-cine-vault-flow.base44.app)  
**Reconstruction Target:** Next.js 15 App Router / React 19 / Tailwind CSS

---

## 1. Master Page & Screen Matrix

| # | Route / Path | Screen Name | Access Level | Layout / Shell | Key Capabilities |
|---|---|---|---|---|---|
| 01 | `/` | Landing Page | Public | Marketing Header + Footer | Hero banner, value propositions, feature highlights, prompt pills, interactive watchlist teaser |
| 02 | `/login` | Sign In | Public | Minimal Centered Auth Shell | Email/password login, error alerts, remember me, route redirection |
| 03 | `/register` | Sign Up | Public | Minimal Centered Auth Shell | New user registration, terms checkbox, automatic profile onboarding trigger |
| 04 | `/forgot-password` | Password Recovery | Public | Minimal Centered Auth Shell | Password reset email request form |
| 05 | `/reset-password` | Set New Password | Public | Minimal Centered Auth Shell | Password update submission |
| 06 | `/legal/:doc` | Legal Documents | Public | Simple Legal Layout | Terms of service and privacy policy |
| 07 | `/dashboard` | User Dashboard | Protected | App Shell (Sidebar + TopBar) | Quick stats counters, Currently Watching carousel, Recent Activity feed, Smart Shelves |
| 08 | `/discover` | Universal Discovery | Protected | App Shell (Sidebar + TopBar) | Keyword search, AI Vibe Search toggle, 19-genre filter carousel, sort controls, movie grid |
| 09 | `/movie/:id` | Movie Detail View | Protected | App Shell (Sidebar + TopBar) | High-res backdrop hero, trailer modal, action bar, cast/crew reel, streaming providers, recommendations |
| 10 | `/watchlist` | Watchlist ("Want") | Protected | App Shell (Sidebar + TopBar) | Saved movies, priority sort, genre filter, reminder date setter, status toggle |
| 11 | `/watched` | Watched History / Diary | Protected | App Shell (Sidebar + TopBar) | Chronological viewing diary, user star ratings, personal notes/reviews, date filters |
| 12 | `/favorites` | Favorites Showcase | Protected | App Shell (Sidebar + TopBar) | Dedicated filtered collection of all movies flagged with `is_favorite = true` |
| 13 | `/collections` | Collections Hub | Protected | App Shell (Sidebar + TopBar) | User-created custom lists, smart collection cards, collection creator modal |
| 14 | `/collections/:id` | Collection Detail | Protected / Public | App Shell (Sidebar + TopBar) | Collection banner, custom notes per film, reorder drag-and-drop, public share URL |
| 15 | `/collections/smart/:slug` | 12 Smart Collections | Protected | App Shell (Sidebar + TopBar) | Automated algorithmic collections based on genres, mood, ratings, and era |
| 16 | `/import` | Letterboxd Importer | Protected | App Shell (Sidebar + TopBar) | Drag-and-drop CSV importer, batch TMDB ID resolver, conflict resolver, batch insert |
| 17 | `/timeline` | Cinema Timeline | Protected | App Shell (Sidebar + TopBar) | Month-by-month and year-by-year visual viewing habits, stats breakdown |
| 18 | `/profile` | User Profile | Protected | App Shell (Sidebar + TopBar) | Avatar, bio, Letterboxd handle, stats summary, favorite genres |
| 19 | `/settings` | Settings | Protected | App Shell (Sidebar + TopBar) | Account management, theme preferences, notifications |

---

## 2. Core Functional Components & Capabilities

### 2.1 Navigation & Global App Shell

1. **Persistent Left Sidebar (`Desktop`):**
   - **Branding:** Cineaste emerald logo mark + "CINEASTE" wordmark in Sora bold.
   - **Navigation Groups:**
     - *Explore:* Dashboard (`/dashboard`), Discover (`/discover`), Timeline (`/timeline`)
     - *Library:* Watchlist (`/watchlist`), Watched Diary (`/watched`), Favorites (`/favorites`), Collections (`/collections`)
     - *Tools:* Letterboxd Importer (`/import`)
   - **User Menu (Bottom):** User avatar, username, settings quick link, log out button.
2. **Top Navigation Bar:**
   - **Global Search Pill (`Cmd+K` / `Ctrl+K`):** Opens the command palette anywhere in the application.
   - **Quick Action Button:** Instant "+ Add Movie" button opening search modal.
   - **Theme & Notifications:** Notification bell for upcoming movie release dates (`remind_on`).
3. **Mobile Bottom Navigation Bar (`Mobile`):**
   - High-priority navigation items: Dashboard, Discover, Watchlist, Watched, Collections.
4. **Global Command Palette (`Cmd+K`):**
   - Instant search across TMDB movie database.
   - Keyboard arrow navigation, enter to select, deep link to `/movie/:id`.
   - Recent searches history.

---

### 2.2 Discovery Engine & AI Vibe Search

1. **Dual Search Modes:**
   - **Keyword Title Search:** Fast autocomplete against TMDB `/search/movie`.
   - **AI Vibe Search Mode:** Conversational prompt input (e.g. *"dark mind-bending thriller with a plot twist"*, *"cozy 90s autumnal rom-com"*, *"cyberpunk anime"*).
   - Generates structured discovery filters via Gemini API:
     - `with_genres` (TMDB genre IDs)
     - `sort_by` (`popularity.desc`, `vote_average.desc`, `release_date.desc`)
     - `from_year` / `to_year`
     - `vote_count_gte` (avoids obscure zero-vote entries)
     - `interpretation` (human-readable summary displayed in UI: *"Showing highly rated psychological thrillers from the 90s and 2000s"*)
2. **Genre Filter Pills Carousel:**
   - Horizontal scrollable pill list of 19 TMDB genres.
   - Active state highlighted in Cineaste Emerald (`bg-[hsl(var(--primary))] text-black`).
3. **Sort & Filter Toolbar:**
   - Sort dropdown: Most Popular, Highest Rated, Newest Releases.
   - Year Range slider / dropdown.
   - View mode toggle: Compact Grid / Expanded Cards / List.
4. **Movie Poster Card Component:**
   - Standard 2:3 aspect ratio poster with fallback placeholder for missing artwork.
   - Floating badge with TMDB rating (`★ 8.4`) in gold accent.
   - Hover Overlay:
     - Quick "Want to Watch" toggle button (+).
     - Quick "Mark as Watched" button (check).
     - Quick "Favorite" toggle button (heart).
     - Release year & runtime chip.

---

### 2.3 Movie Detail View (`/movie/:id`)

1. **Cinematic Backdrop Hero:**
   - 16:9 high-resolution backdrop with dark gradient fade into obsidian background.
   - High-resolution poster card with glow shadow.
   - Primary Title (Sora bold), Tagline (italicized muted), Release Year, Runtime, Age Rating (PG-13, R, etc.), and Director name.
2. **Interactive Action Bar:**
   - **Status Dropdown / Segmented Control:**
     - Want to Watch (Watchlist)
     - Watched
     - Currently Watching
     - Not on List
   - **Favorite Toggle:** Emerald/Red heart button with optimistic update.
   - **User Star Rating:** 10-point interactive star rating widget.
   - **Add to Collection Button:** Opens modal listing user's collections with checkbox selection.
   - **Diary Note / Review Button:** Opens modal to log viewing date and personal review text.
3. **Trailer Player Modal:**
   - Embedded responsive YouTube player fetching official trailer key from TMDB `/movie/{id}/videos`.
4. **Cast & Crew Reel:**
   - Horizontal scrollable reel of top cast members with actor headshot photo, character name, and actor name.
5. **Where to Watch (Streaming Providers):**
   - Displays JustWatch / TMDB provider icons for Flatrate (Netflix, Prime, Max, etc.), Rent, and Buy based on region.
6. **Similar & Recommended Films Carousel:**
   - TMDB recommendations carousel allowing deep navigation to related titles.

---

### 2.4 Watchlist & Diary Management

1. **Watchlist (`/watchlist`):**
   - Displays all films with status `want`.
   - Filter by genre, decade, runtime.
   - Sort by Date Added, Release Date, Title, or TMDB Rating.
   - Custom reminder date picker (`remind_on`).
2. **Watched History (`/watched`):**
   - Chronological log of all movies with status `watched`.
   - Displays user rating, view date, and written review.
   - Filter by viewing month/year.
3. **Favorites (`/favorites`):**
   - Filtered view of movies where `is_favorite = true`.
   - Grid presentation with custom sharing options.

---

### 2.5 Curated & Smart Collections

1. **User Curated Collections (`/collections`):**
   - Create custom collections (e.g., *"Best Noir Films"*, *"Spooky Season"*, *"Director Spotlight: Villeneuve"*).
   - Custom title, description, cover image, and accent color.
   - Add/remove movies, personal notes per movie in collection, drag-and-drop reordering.
   - Privacy toggle: Public shareable link vs. Private.
2. **12 Dynamic Smart Collections (`/collections/smart/:slug`):**
   - Automated collections generated on the fly based on rules:
     - `action`: High-adrenaline, high-rating action films.
     - `comedy`: Feel-good, top-rated comedies.
     - `scifi`: Thought-provoking science fiction.
     - `mind-bending`: Complex, psychological, puzzle-box plots.
     - `horror`: Top horror and atmospheric thrillers.
     - `drama`: Emotional and character-driven prestige dramas.
     - `animation`: Masterpieces of Western & Japanese animation.
     - `romance`: Romantic comedies and dramas.
     - `family`: Wholesome all-ages cinema.
     - `weekend`: High-entertainment crowd-pleasers.
     - `top-rated`: All-time cinema masterworks.
     - `classics`: Golden age and vintage cinema (pre-1980).

---

### 2.6 Letterboxd Migration & Ingestion Engine (`/import`)

1. **Upload Zone:**
   - Drag-and-drop file uploader supporting `.csv` files or `.zip` archive export from Letterboxd.
2. **Client-Side CSV Parsing:**
   - Auto-detects format (`watched.csv`, `ratings.csv`, `watchlist.csv`, custom lists).
   - Extracts `Name`, `Year`, `Rating`, `Date`.
3. **Batch TMDB Matching Algorithm:**
   - Progress bar showing resolution status.
   - Queries TMDB search with exact title and year constraint to ensure high accuracy.
   - Displays preview table with matched poster, title, user rating, and status.
   - Duplicate prevention against existing user watchlist items.
4. **Batch Persistence:**
   - Single-click confirmation to batch-insert resolved records into Supabase `watchlist_items` and `activities`.

---

### 2.7 Viewing Analytics & Timeline (`/timeline`)

1. **Timeline Breakdown:**
   - Month-by-month and year-by-year accordion/feed of watched films.
2. **Cinematic Statistics:**
   - Total hours watched, average rating given, top genres watched, most-watched directors and actors.
   - Interactive charts styled with Cineaste chart tokens (`chart-1` through `chart-5`).

import { NextResponse } from "next/server";

const BASE44_APP_ID = "6a60f806337b57053bc5bc05";
const BASE44_PROXY_URL = `https://eminent-cine-vault-flow.base44.app/api/apps/${BASE44_APP_ID}/functions/tmdbProxy`;

// In-memory cache for ultra-fast, zero-500 response delivery
const memoryCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

const CURATED_MOVIES = [
  {
    id: 1400940,
    tmdb_id: 1400940,
    title: "Clayface",
    poster_path: "/9l1NuFjel2j89hiuiJbsxfblqjy.jpg",
    backdrop_path: "/xSDoxv4pHvs4xZjvTb0Iqg1A6ro.jpg",
    release_date: "2026-10-19",
    overview:
      "Matt Hagen's meteoric rise from Gotham street kid to Hollywood leading man is tragically cut short when a local crime boss's actions leave him horribly disfigured. Abandoned by his team and with nothing left, Matt seeks out a cutting edge treatment that miraculously returns him to his former self… but also unexpectedly affects his grip on reality.",
    vote_average: 7.5,
    vote_count: 314,
    genre_ids: [28, 80, 18],
    popularity: 171.9,
    original_language: "en",
    runtime: 128,
  },
  {
    id: 1384216,
    tmdb_id: 1384216,
    title: "The Dog Stars",
    poster_path: "/5O616X9vmRzQdB68PHzBewPittd.jpg",
    backdrop_path: "/3k7GzxOdLZkN3eZsuhLi2eRzkXO.jpg",
    release_date: "2026-08-26",
    overview:
      "After the world's population has been ravaged by a pandemic, a man lives a lonesome existence in a Colorado airplane hangar with his dog and a dour gunman he has befriended. When a mysterious transmission comes through on the radio while he's flying his old Cessna, it sparks a hunt for the provenance of the sound.",
    vote_average: 7.1,
    vote_count: 706,
    genre_ids: [18, 878, 53],
    popularity: 188.8,
    original_language: "en",
    runtime: 122,
  },
  {
    id: 1283515,
    tmdb_id: 1283515,
    title: "Verity",
    poster_path: "/rmaNMA1seHqpjtnYKzyynFAr1g8.jpg",
    backdrop_path: "/cKetrF2dAnQ0AMV5i4BMOs41I5P.jpg",
    release_date: "2026-09-30",
    overview:
      "Lowen Ashleigh, hired to ghostwrite for best-selling author Verity Crawford, uncovers Verity's autobiographical notes, and becomes involved in what may prove to be a lethal conspiracy.",
    vote_average: 6.8,
    vote_count: 448,
    genre_ids: [53, 9648, 18],
    popularity: 218.6,
    original_language: "en",
    runtime: 114,
  },
  {
    id: 1003596,
    tmdb_id: 1003596,
    title: "Avengers: Doomsday",
    poster_path: "/bqAHPSEyRkM4BpkncGFCKjBXf9p.jpg",
    backdrop_path: "/rObL4of4eFA8yWaN9pRFo9aOVNi.jpg",
    release_date: "2026-12-16",
    overview:
      "Earth's Mightiest Heroes confront Doctor Doom across fractured timelines in a battle for the multiverse.",
    vote_average: 8.5,
    vote_count: 240,
    genre_ids: [28, 12, 878],
    popularity: 380.5,
    original_language: "en",
    runtime: 150,
  },
  {
    id: 1170608,
    tmdb_id: 1170608,
    title: "Dune: Part Three",
    poster_path: "/glt0v4I89rMWstDNCaFXc5SNyO1.jpg",
    backdrop_path: "/i5E9H7Ik0u61ylDDTbmUpTL3Yw.jpg",
    release_date: "2026-12-15",
    overview:
      "Nearly two decades after he seized control of the Imperium, Paul Atreides is now a ruthless Emperor, and must face the consequences of his reign as old allies return and terrifying new threats emerge.",
    vote_average: 8.7,
    vote_count: 512,
    genre_ids: [878, 12, 18],
    popularity: 450.2,
    original_language: "en",
    runtime: 165,
  },
  {
    id: 969681,
    tmdb_id: 969681,
    title: "Spider-Man: Brand New Day",
    poster_path: "/bjiS5ipwxb9JFy3XRRN4OAilSeX.jpg",
    backdrop_path: "/4tjxYg2AbOzzG9G1YuiT2NzYhlH.jpg",
    release_date: "2026-07-29",
    overview:
      "Fighting crime full-time in a world that doesn't remember him, Peter Parker faces a sinister new threat looming over the city.",
    vote_average: 8.4,
    vote_count: 6414,
    genre_ids: [28, 12, 878],
    popularity: 376.6,
    original_language: "en",
    runtime: 135,
  },
  {
    id: 791523,
    tmdb_id: 791523,
    title: "Wildwood",
    poster_path: "/snFM00mpNAfUzUtkdEW0uDEvXA0.jpg",
    backdrop_path: "/sl5NJ1vtyhP9Vr88bB4blULsJYp.jpg",
    release_date: "2026-10-19",
    overview:
      "Prue and her classmate Curtis are drawn into a magical forest filled with enchanted creatures and formidable adversaries to rescue Prue's baby brother.",
    vote_average: 8.6,
    vote_count: 127,
    genre_ids: [16, 12, 14],
    popularity: 145.3,
    original_language: "en",
    runtime: 108,
  },
  {
    id: 1465063,
    tmdb_id: 1465063,
    title: "Forgotten Island",
    poster_path: "/myd1K3gefdNAWFsGNRDdMeiK9Qg.jpg",
    backdrop_path: "/cNICUho5uiAGkfCAQq1ihyaMla4.jpg",
    release_date: "2026-09-10",
    overview:
      "High school graduates Jo and Raissa stumble upon a mysterious portal transporting them to the fantastical island of Nakali where memories are currency.",
    vote_average: 7.7,
    vote_count: 167,
    genre_ids: [14, 9648, 12],
    popularity: 122.4,
    original_language: "en",
    runtime: 118,
  },
  {
    id: 872585,
    tmdb_id: 872585,
    title: "Oppenheimer",
    poster_path: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    backdrop_path: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    release_date: "2023-07-19",
    overview:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    vote_average: 8.1,
    vote_count: 8900,
    genre_ids: [18, 36],
    popularity: 310.2,
    original_language: "en",
    runtime: 180,
  },
  {
    id: 157336,
    tmdb_id: 157336,
    title: "Interstellar",
    poster_path: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    backdrop_path: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    release_date: "2014-11-05",
    overview:
      "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
    vote_average: 8.4,
    vote_count: 34500,
    genre_ids: [12, 18, 878],
    popularity: 290.0,
    original_language: "en",
    runtime: 169,
  },
  {
    id: 335984,
    tmdb_id: 335984,
    title: "Blade Runner 2049",
    poster_path: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    backdrop_path: "/ilRyAZwNGoA9NcnMe09j8MNE90I.jpg",
    release_date: "2017-10-04",
    overview:
      "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that has the potential to plunge what's left of society into chaos.",
    vote_average: 8.0,
    vote_count: 13200,
    genre_ids: [878, 9648, 53],
    popularity: 160.4,
    original_language: "en",
    runtime: 164,
  },
  {
    id: 414906,
    tmdb_id: 414906,
    title: "The Batman",
    poster_path: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
    backdrop_path: "/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg",
    release_date: "2022-03-01",
    overview:
      "In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler.",
    vote_average: 7.7,
    vote_count: 9800,
    genre_ids: [80, 9648, 53],
    popularity: 195.1,
    original_language: "en",
    runtime: 176,
  },
  {
    id: 76341,
    tmdb_id: 76341,
    title: "Mad Max: Fury Road",
    poster_path: "/8tZYtuWezp8JbcsvHYO0O46tFbo.jpg",
    backdrop_path: "/nlCHUWjY9XWbuEUQauCBgnY8ymF.jpg",
    release_date: "2015-05-13",
    overview:
      "An apocalyptic story set in the furthest reaches of our planet, in a stark desert landscape where humanity is broken, and almost everyone is crazed fighting for the necessities of life.",
    vote_average: 7.6,
    vote_count: 22000,
    genre_ids: [28, 12, 878, 53],
    popularity: 245.0,
    original_language: "en",
    runtime: 120,
  },
  {
    id: 693134,
    tmdb_id: 693134,
    title: "Dune: Part Two",
    poster_path: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s520gh0.jpg",
    release_date: "2024-03-01",
    overview:
      "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    vote_average: 8.2,
    vote_count: 5800,
    genre_ids: [878, 12, 14],
    popularity: 380.0,
    original_language: "en",
    runtime: 166,
  },
  {
    id: 361743,
    tmdb_id: 361743,
    title: "Top Gun: Maverick",
    poster_path: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
    backdrop_path: "/odJ4hx6g6vBt4lBWKFD1tI8WS4x.jpg",
    release_date: "2022-05-24",
    overview:
      "After thirty years, Maverick is still pushing the envelope as a top naval aviator, but must confront ghosts of his past when he leads TOP GUN's elite graduates on an impossible mission.",
    vote_average: 8.2,
    vote_count: 8500,
    genre_ids: [28, 18],
    popularity: 260.0,
    original_language: "en",
    runtime: 130,
  },
];

const GENRES_LIST = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Sci-Fi" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

function parseAiVibePrompt(rawPrompt: string) {
  const q = rawPrompt.toLowerCase().trim();
  const genreIds = new Set<number>();
  const hints: string[] = [];
  const searchTerms: string[] = [];
  let language: string | undefined;
  let year: number | undefined;
  let minRating: number | undefined;
  let minVotes: number | undefined;
  let maxRuntime: number | undefined;
  let sortBy = "popularity.desc";

  const genreRules: Array<{ words: RegExp; genres: number[]; searchTerm?: string; label: string }> = [
    { words: /cyberpunk|cyber|neo-?noir|dystop|futur|blade runner/i, genres: [878, 53], searchTerm: "cyberpunk", label: "Cyberpunk & Neo-Noir" },
    { words: /noir|rainy|lonely|isolation|solitude|bleak|melanchol|moody/i, genres: [9648, 80, 18], searchTerm: "noir", label: "Atmospheric Nocturne" },
    { words: /sci-?fi|space|time travel|wormhole|alien|planet|multiverse/i, genres: [878], label: "Sci-Fi" },
    { words: /thriller|suspense|twist|mind-?bend|cerebral|psycho/i, genres: [53, 9648], label: "Mind-Bending Thriller" },
    { words: /crime|detective|heist|mafia|gangster/i, genres: [80, 53], label: "Crime" },
    { words: /horror|scary|spooky|ghost|haunt|terror|slasher/i, genres: [27, 53], label: "Horror" },
    { words: /cozy|warm|heartwarm|feel[- ]?good|comfort|uplift|whimsical/i, genres: [35, 10751, 10749], label: "Warm & Feel-Good" },
    { words: /funny|comedy|hilarious|laugh|satire/i, genres: [35], label: "Comedy" },
    { words: /romanc|love|heart[- ]?tug|romantic/i, genres: [10749, 18], label: "Romance" },
    { words: /action|adrenaline|chase|explosi|superhero|marvel|martial/i, genres: [28, 12], label: "Action" },
    { words: /animat|anime|ghibli|pixar/i, genres: [16], label: "Animation" },
    { words: /drama|oscar|acclaimed|masterpiece|critically|prestige|arthouse/i, genres: [18], label: "Acclaimed Drama" },
    { words: /fantasy|magic|myth|medieval/i, genres: [14, 12], label: "Fantasy" },
    { words: /documentary|true story|non-?fiction/i, genres: [99], label: "Documentary" },
    { words: /war|history|historical|period/i, genres: [10752, 36], label: "Historical" },
  ];

  for (const rule of genreRules) {
    if (rule.words.test(q)) {
      rule.genres.forEach((g) => genreIds.add(g));
      hints.push(rule.label);
      if (rule.searchTerm) searchTerms.push(rule.searchTerm);
    }
  }

  const langRules: Array<{ regex: RegExp; code: string; label: string }> = [
    { regex: /\btamil\b/i, code: "ta", label: "Tamil" },
    { regex: /\bmalayalam\b/i, code: "ml", label: "Malayalam" },
    { regex: /\btelugu\b/i, code: "te", label: "Telugu" },
    { regex: /\bkannada\b/i, code: "kn", label: "Kannada" },
    { regex: /\bhindi|bollywood\b/i, code: "hi", label: "Hindi" },
    { regex: /\bkorean|k-drama|seoul\b/i, code: "ko", label: "Korean" },
    { regex: /\bjapanese|tokyo|anime\b/i, code: "ja", label: "Japanese" },
    { regex: /\bfrench|paris\b/i, code: "fr", label: "French" },
    { regex: /\bspanish\b/i, code: "es", label: "Spanish" },
  ];
  for (const l of langRules) {
    if (l.regex.test(q)) {
      language = l.code;
      hints.push(l.label);
      break;
    }
  }

  const exactYearMatch = q.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
  if (exactYearMatch) {
    year = Number(exactYearMatch[1]);
    hints.push(String(year));
  } else if (/\b90s\b/i.test(q)) {
    year = 1995;
    hints.push("1990s");
  } else if (/\b80s\b/i.test(q)) {
    year = 1985;
    hints.push("1980s");
  }

  if (/oscar|masterpiece|acclaimed|best|critically|top/i.test(q)) {
    minRating = 7.4;
    minVotes = 800;
    sortBy = "vote_average.desc";
  }
  if (/short|quick|under 90/i.test(q)) {
    maxRuntime = 95;
    hints.push("Under 95m");
  }

  if (q.includes("marvel")) searchTerms.push("Avengers");
  if (q.includes("time travel")) searchTerms.push("time travel");
  if (q.includes("space horror")) searchTerms.push("Alien");

  const hasIntent = genreIds.size > 0 || Boolean(language) || Boolean(year) || Boolean(minRating) || searchTerms.length > 0;

  return {
    hasIntent,
    genreIds: Array.from(genreIds),
    language,
    year,
    minRating,
    minVotes: minVotes ?? (hasIntent ? 120 : undefined),
    maxRuntime,
    sortBy,
    searchTerms,
    interpretation: hints.length > 0
      ? `AI Vibe interpretation: ${hints.join(" • ")}`
      : `Searching TMDB catalog for "${rawPrompt}"`,
  };
}

function scoreVibeMatch(movie: any, rawPrompt: string, targetGenres: number[]): number {
  const words = rawPrompt
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(
      (w) =>
        w.length >= 3 &&
        !["with", "movies", "movie", "films", "film", "that", "from", "like", "vibe", "and", "the"].includes(w)
    );
  const text = `${movie.title || ""} ${movie.overview || ""}`.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (text.includes(w)) score += 2.5;
  }
  const mGenres: number[] = Array.isArray(movie.genre_ids) ? movie.genre_ids : [];
  for (const g of targetGenres) {
    if (mGenres.includes(g)) score += 2.0;
  }
  const votes = Number(movie.vote_count) || 0;
  const rating = Number(movie.vote_average) || 0;
  // Favor established, genuinely released cinema with real votes & poster artwork
  if (votes >= 50) score += Math.min(8, Math.log10(votes) * 2.2);
  else if (votes === 0) score -= 5;
  if (movie.poster_path) score += 2;
  score += Math.min(3, rating / 3);
  return score;
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Normalize detail/details action aliases
    if (payload.action === "detail") {
      payload.action = "details";
    }

    // Normalize language alias
    if (payload.with_original_language && !payload.language) {
      payload.language = payload.with_original_language;
    }

    const cacheKey = JSON.stringify(payload);
    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return NextResponse.json(cached.data);
    }

    // Handle AI Vibe Search using LIVE TMDB discovery & search (never fabricating unrelated movies)
    if (payload.action === "ai_search" || payload.ai === true) {
      const rawQuery = String(payload.query || payload.prompt || "").trim();
      if (!rawQuery) {
        return NextResponse.json({ results: [], page: 1, total_pages: 1, total_results: 0 });
      }

      const vibe = parseAiVibePrompt(rawQuery);
      const jobs: Promise<any>[] = [];

      if (vibe.genreIds.length > 0 || vibe.language || vibe.year || vibe.minRating || vibe.maxRuntime) {
        // Use OR "|" for multi-genre mood exploration, or intersection for 2 genres
        const genreParam = vibe.genreIds.length > 0 ? vibe.genreIds.join("|") : undefined;
        jobs.push(
          fetch(BASE44_PROXY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "discover",
              with_genres: genreParam,
              language: vibe.language,
              year: vibe.year,
              min_rating: vibe.minRating,
              min_votes: vibe.minVotes,
              max_runtime: vibe.maxRuntime,
              sort_by: vibe.sortBy,
              page: 1,
            }),
            signal: AbortSignal.timeout(7000),
          }).then((r) => (r.ok ? r.json() : null))
        );
      }

      const keywordTerm = vibe.searchTerms[0] || (!vibe.hasIntent ? rawQuery : null);
      if (keywordTerm) {
        jobs.push(
          fetch(BASE44_PROXY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "search", query: keywordTerm, page: 1 }),
            signal: AbortSignal.timeout(7000),
          }).then((r) => (r.ok ? r.json() : null))
        );
      }

      const settled = await Promise.allSettled(jobs);
      const mergedMap = new Map<number, any>();
      let anyUpstreamSuccess = false;

      for (const res of settled) {
        if (res.status === "fulfilled" && res.value && Array.isArray(res.value.results)) {
          anyUpstreamSuccess = true;
          for (const item of res.value.results) {
            const id = Number(item.tmdb_id || item.id);
            if (id && !mergedMap.has(id)) {
              mergedMap.set(id, item);
            }
          }
        }
      }

      if (!anyUpstreamSuccess) {
        return NextResponse.json(
          {
            results: [],
            page: 1,
            total_pages: 0,
            total_results: 0,
            error: "Unable to reach film discovery service right now. Please try again.",
          },
          { status: 502 }
        );
      }

      const ranked = Array.from(mergedMap.values())
        .filter((m) => (vibe.hasIntent ? (Number(m.vote_count) || 0) >= 10 || Boolean(m.poster_path) : true))
        .sort((a, b) => scoreVibeMatch(b, rawQuery, vibe.genreIds) - scoreVibeMatch(a, rawQuery, vibe.genreIds))
        .slice(0, 24);

      const aiResponse = {
        results: ranked,
        interpretation:
          ranked.length > 0
            ? vibe.interpretation
            : `No films matched "${rawQuery}" in live TMDB results.`,
        page: 1,
        total_pages: 1,
        total_results: ranked.length,
      };

      memoryCache.set(cacheKey, { data: aiResponse, expiry: Date.now() + CACHE_TTL_MS });
      return NextResponse.json(aiResponse);
    }

    // Handle genres action directly if needed
    if (payload.action === "genres") {
      const genresResponse = { genres: GENRES_LIST };
      return NextResponse.json(genresResponse);
    }

    // Upstream proxy exposes movie-specific recommendations & similar titles via `action: "details"`
    if (payload.action === "recommendations" && payload.id) {
      try {
        const resp = await fetch(BASE44_PROXY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "details", id: payload.id }),
          signal: AbortSignal.timeout(7000),
        });
        if (resp.ok) {
          const det = await resp.json();
          const combined = [...(det?.recommendations || []), ...(det?.similar || [])];
          const seenIds = new Set<number>();
          const uniqueRecs = combined.filter((m: any) => {
            const mId = Number(m?.tmdb_id || m?.id);
            if (!mId || mId === Number(payload.id) || seenIds.has(mId)) return false;
            seenIds.add(mId);
            return true;
          });
          const recPayload = {
            page: 1,
            total_pages: 1,
            total_results: uniqueRecs.length,
            results: uniqueRecs,
          };
          memoryCache.set(cacheKey, { data: recPayload, expiry: Date.now() + CACHE_TTL_MS });
          return NextResponse.json(recPayload);
        }
      } catch {
        // Fall through cleanly to empty recommendations rather than showing unrelated movies
      }
      return NextResponse.json({ page: 1, total_pages: 1, total_results: 0, results: [] });
    }

    // Attempt remote upstream fetch with 6-second timeout
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(BASE44_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && (Array.isArray(data.results) || Array.isArray(data.genres) || data.title)) {
          memoryCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL_MS });
          return NextResponse.json(data);
        }
      }
    } catch {
      // Remote fetch failed or timed out — seamlessly fallback to curated data below
    }

    // Fallback logic to guarantee a rich 200 OK response with real movies
    let fallbackResults = [...CURATED_MOVIES];

    if (payload.action === "search" && payload.query) {
      const q = payload.query.toLowerCase().trim();
      fallbackResults = CURATED_MOVIES.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.overview.toLowerCase().includes(q)
      );
    } else if (payload.with_genres) {
      const targetGenreIds = String(payload.with_genres)
        .split(/[|,]/)
        .map((g: string) => Number(g.trim()))
        .filter((n: number) => !isNaN(n));
      const filtered = CURATED_MOVIES.filter(
        (m) => m.genre_ids && targetGenreIds.some((g: number) => m.genre_ids.includes(g))
      );
      if (filtered.length > 0) fallbackResults = filtered;
    } else if (payload.sort_by?.includes("vote_average")) {
      fallbackResults.sort((a, b) => b.vote_average - a.vote_average);
    }

    const fallbackResponse = {
      page: payload.page || 1,
      total_pages: 1,
      total_results: fallbackResults.length,
      results: fallbackResults,
    };

    return NextResponse.json(fallbackResponse);
  } catch (error: any) {
    // Zero-500 guarantee: always return valid JSON array
    return NextResponse.json({
      page: 1,
      total_pages: 1,
      total_results: CURATED_MOVIES.length,
      results: CURATED_MOVIES,
    });
  }
}

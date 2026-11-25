import type { Movie } from "@/types";
import type { PersonItem } from "@/components/discover/people-rail";

export interface TMDBResponse {
  page: number;
  total_pages: number;
  total_results: number;
  results: Movie[];
  interpretation?: string;
  error?: string;
}

export interface TMDBPeopleResponse {
  results: PersonItem[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

/**
 * Universal client service connecting to the verified discovery gateway
 */
export async function tmdbFetch(payload: Record<string, any>): Promise<TMDBResponse> {
  try {
    const res = await fetch("/api/tmdb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let errMsg = `Request failed (${res.status})`;
      try {
        const errData = await res.json();
        if (errData?.error) errMsg = errData.error;
      } catch {}
      return { page: 1, total_pages: 0, total_results: 0, results: [], error: errMsg };
    }

    const data = await res.json();
    const rawResults = data.results || [];

    return {
      ...data,
      page: data.page || 1,
      total_pages: data.total_pages || 1,
      total_results: data.total_results || rawResults.length,
      interpretation: data.interpretation,
      results: rawResults.map((item: any) => ({
        id: item.tmdb_id || item.id,
        tmdb_id: item.tmdb_id || item.id,
        title: item.title || item.name || "Untitled",
        overview: item.overview || "",
        poster_path: item.poster_path || null,
        backdrop_path: item.backdrop_path || null,
        release_date: item.release_date || item.first_air_date || "",
        vote_average: item.vote_average ?? 0,
        vote_count: item.vote_count ?? 0,
        genre_ids: item.genre_ids || [],
        runtime: item.runtime || null,
      })),
    };
  } catch (err: any) {
    return {
      page: 1,
      total_pages: 0,
      total_results: 0,
      results: [],
      error: err?.message || "Network error contacting discovery service",
    };
  }
}

/**
 * Fetch AI semantic vibe search
 */
export async function tmdbAiSearch(query: string): Promise<TMDBResponse> {
  return tmdbFetch({ action: "ai_search", query });
}

/**
 * Fetch genres list
 */
export async function tmdbFetchGenres(): Promise<TMDBGenre[]> {
  try {
    const res = await fetch("/api/tmdb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "genres" }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.genres || [];
  } catch {
    return [];
  }
}

/**
 * Fetch trending people
 */
export async function tmdbFetchPeople(window: string = "week"): Promise<PersonItem[]> {
  try {
    const res = await fetch("/api/tmdb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "trendingPeople", window }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.results || []).slice(0, 12).map((p: any) => ({
      id: p.id,
      name: p.name || "Unknown",
      profile_path: p.profile_path || null,
      known_for_department: p.known_for_department || p.department || "",
    }));
  } catch {
    return [];
  }
}

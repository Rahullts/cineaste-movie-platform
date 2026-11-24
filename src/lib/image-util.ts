/**
 * Universal utility to resolve high-res TMDB artwork and posters.
 * Uses direct TMDB CDN with local server proxy fallback to guarantee
 * images load in all browsers (including Brave and ad-blockers).
 */

export type TmdbSize =
  | "w92"
  | "w154"
  | "w185"
  | "w342"
  | "w500"
  | "w780"
  | "w1280"
  | "h632"
  | "original";

export function getTmdbImageUrl(
  path: string | null | undefined,
  size: TmdbSize = "original"
): string | null {
  if (!path || typeof path !== "string") return null;

  const trimmed = path.trim();
  if (!trimmed) return null;

  // If already proxied, data URI, or full external URL, return directly
  if (
    trimmed.startsWith("/api/image") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    return trimmed;
  }

  // Clean leading slash for standard TMDB relative path
  const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  // Use local backend proxy by default to prevent client ISP/adblock DNS failures
  return `/api/image?path=${encodeURIComponent(clean)}&w=${size}`;
}

/**
 * High-resolution movie poster helper (w780 standard for razor-sharp Retina display)
 */
export function getTmdbPosterUrl(
  path: string | null | undefined,
  size: "w500" | "w780" | "original" = "w780"
): string | null {
  return getTmdbImageUrl(path, size);
}

/**
 * High-resolution cinematic backdrop helper (original/w1280 for full-bleed hero artwork)
 */
export function getTmdbBackdropUrl(
  path: string | null | undefined,
  size: "w1280" | "original" = "original"
): string | null {
  return getTmdbImageUrl(path, size);
}

/**
 * High-resolution cast and crew profile headshots
 */
export function getTmdbProfileUrl(
  path: string | null | undefined,
  size: "w185" | "h632" | "original" = "h632"
): string | null {
  return getTmdbImageUrl(path, size);
}

export function getLocalProxiedImageUrl(
  path: string | null | undefined,
  size: TmdbSize = "original"
): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:") || trimmed.startsWith("/api/image")) return trimmed;

  let clean = trimmed;
  if (trimmed.includes("image.tmdb.org/t/p/")) {
    const parts = trimmed.split("/t/p/");
    if (parts[1]) {
      const subParts = parts[1].split("/");
      clean = "/" + subParts.slice(1).join("/");
    }
  } else if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  const cleanPath = clean.startsWith("/") ? clean : `/${clean}`;
  return `/api/image?path=${encodeURIComponent(cleanPath)}&w=${size}`;
}

export function getWsrvImageUrl(
  path: string | null | undefined,
  size: TmdbSize = "original"
): string | null {
  if (!path || typeof path !== "string") return null;
  const trimmed = path.trim();
  if (!trimmed) return null;

  const clean = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const tmdbTarget = `image.tmdb.org/t/p/${size}${clean}`;
  return `https://wsrv.nl/?url=${encodeURIComponent(tmdbTarget)}&output=webp&q=90`;
}

/**
 * Returns a bulletproof cascade of fallback URLs for a given image path
 */
export function getImageCandidates(
  path: string | null | undefined,
  size: TmdbSize = "original"
): string[] {
  if (!path || typeof path !== "string") return [];
  const trimmed = path.trim();
  if (!trimmed) return [];

  const candidates: string[] = [];
  const direct = getTmdbImageUrl(trimmed, size);
  if (direct) candidates.push(direct);

  const localProxy = getLocalProxiedImageUrl(trimmed, size);
  if (localProxy && !candidates.includes(localProxy)) candidates.push(localProxy);

  const wsrv = getWsrvImageUrl(trimmed, size);
  if (wsrv && !candidates.includes(wsrv)) candidates.push(wsrv);

  return candidates;
}

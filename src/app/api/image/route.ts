import { NextRequest, NextResponse } from "next/server";

interface CachedImageEntry {
  bytes: ArrayBuffer;
  contentType: string;
  expiresAt: number;
}

const IMAGE_CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const MAX_CACHE_ENTRIES = 200;

const imageCache = new Map<string, CachedImageEntry>();
const inflightFetches = new Map<string, Promise<{ bytes: ArrayBuffer; contentType: string } | null>>();

function getCachedImage(key: string): CachedImageEntry | null {
  const hit = imageCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    imageCache.delete(key);
    return null;
  }
  // Refresh LRU order
  imageCache.delete(key);
  imageCache.set(key, hit);
  return hit;
}

function setCachedImage(key: string, entry: CachedImageEntry) {
  if (imageCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = imageCache.keys().next().value;
    if (oldestKey) imageCache.delete(oldestKey);
  }
  imageCache.set(key, entry);
}

async function fetchUpstreamImage(url: string, timeoutMs: number) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const contentType = resp.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Unexpected content-type: ${contentType}`);
  }
  const bytes = await resp.arrayBuffer();
  if (!bytes || bytes.byteLength === 0) {
    throw new Error("Empty image response");
  }
  return { bytes, contentType };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get("path");
    const rawW = searchParams.get("w") || "original";

    if (!path) {
      return new NextResponse("Missing image path", { status: 400 });
    }

    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    const normalized = rawW.toLowerCase().trim();

    let widthNum = "original";
    if (normalized !== "original") {
      const stripped = normalized.replace(/^w/i, "");
      widthNum = `w${stripped}`;
    }

    const primarySize = widthNum;
    const fallbackSize =
      widthNum === "w1280" ? "original" : widthNum === "original" ? "w1280" : "w500";
    const cacheKey = `${primarySize}:${cleanPath}`;

    const cached = getCachedImage(cacheKey);
    if (cached) {
      return new NextResponse(cached.bytes, {
        headers: {
          "Content-Type": cached.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    let pending = inflightFetches.get(cacheKey);
    if (!pending) {
      pending = (async () => {
        // 1. Direct TMDB first (single upstream connection when reachable)
        try {
          return await fetchUpstreamImage(
            `https://image.tmdb.org/t/p/${primarySize}${cleanPath}`,
            4000
          );
        } catch {}

        // 2. Race direct fallback size & wsrv image proxy only if direct failed
        try {
          return await Promise.any([
            fetchUpstreamImage(
              `https://wsrv.nl/?url=${encodeURIComponent(`image.tmdb.org/t/p/${primarySize}${cleanPath}`)}`,
              7000
            ),
            fetchUpstreamImage(
              `https://image.tmdb.org/t/p/${fallbackSize}${cleanPath}`,
              5000
            ),
          ]);
        } catch {
          return null;
        }
      })().finally(() => {
        inflightFetches.delete(cacheKey);
      });
      inflightFetches.set(cacheKey, pending);
    }

    const result = await pending;
    if (result) {
      setCachedImage(cacheKey, {
        bytes: result.bytes,
        contentType: result.contentType,
        expiresAt: Date.now() + IMAGE_CACHE_TTL_MS,
      });

      return new NextResponse(result.bytes, {
        headers: {
          "Content-Type": result.contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // Return HTTP 404 on upstream failure so client <Image onError> triggers fallback artwork cleanly
    return new NextResponse("Poster unavailable", {
      status: 404,
      headers: {
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    console.error("Image proxy unexpected error:", err);
    return new NextResponse("Image proxy error", { status: 502 });
  }
}

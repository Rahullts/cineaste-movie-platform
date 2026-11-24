import { NextRequest, NextResponse } from "next/server";

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
    const fallbackSize = widthNum === "w1280" ? "original" : widthNum === "original" ? "w1280" : "w780";

    const fetchWithTimeout = async (url: string, timeoutMs: number) => {
      const resp = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return resp;
    };

    let res: Response | null = null;

    // Race direct TMDB with high-availability wsrv proxy
    try {
      res = await Promise.any([
        fetchWithTimeout(`https://image.tmdb.org/t/p/${primarySize}${cleanPath}`, 8000),
        fetchWithTimeout(`https://wsrv.nl/?url=${encodeURIComponent(`image.tmdb.org/t/p/${primarySize}${cleanPath}`)}`, 15000),
      ]);
    } catch {
      try {
        res = await fetchWithTimeout(
          `https://wsrv.nl/?url=${encodeURIComponent(`image.tmdb.org/t/p/${fallbackSize}${cleanPath}`)}`,
          10000
        );
      } catch {
        res = null;
      }
    }

    if (res && res.ok) {
      try {
        const contentType = res.headers.get("content-type") || "image/jpeg";
        const arrayBuffer = await res.arrayBuffer();

        return new NextResponse(arrayBuffer, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } catch (streamErr) {
        console.warn("ArrayBuffer stream error:", streamErr);
      }
    }

    // Clean neutral cinematic SVG placeholder if upstream completely fails
    const fallbackSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
        <defs>
          <radialGradient id="grad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="#141824"/>
            <stop offset="100%" stop-color="#0A0B0F"/>
          </radialGradient>
        </defs>
        <rect width="1280" height="720" fill="url(#grad)"/>
      </svg>
    `.trim();

    return new NextResponse(fallbackSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    console.error("Image proxy unexpected error:", err);
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><rect width="1280" height="720" fill="#0A0B0F"/></svg>`;
    return new NextResponse(fallbackSvg, {
      headers: { "Content-Type": "image/svg+xml", "Cache-Control": "public, max-age=86400" },
    });
  }
}

import { NextRequest } from "next/server";

type SteamGridDbAsset = {
  id: number;
  url: string;
  score?: number;
  width?: number;
  height?: number;
};

type SteamGridDbResponse = {
  success: boolean;
  data?: SteamGridDbAsset[];
};

const STEAMGRIDDB_API = "https://www.steamgriddb.com/api/v2";
const ARTWORK_CACHE_SECONDS = 60 * 60 * 24 * 7;

async function proxyImage(url: string) {
  const response = await fetch(url, {
    next: { revalidate: ARTWORK_CACHE_SECONDS },
  });
  const contentType = response.headers.get("content-type");

  if (!response.ok || !response.body || !contentType?.startsWith("image/")) {
    return null;
  }

  return new Response(response.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=${ARTWORK_CACHE_SECONDS}, stale-while-revalidate=${ARTWORK_CACHE_SECONDS}`,
    },
  });
}

async function steamFallback(appid: string) {
  return (
    (await proxyImage(
      `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`
    )) ?? new Response(null, { status: 404 })
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appid: string }> }
) {
  const apiKey = process.env.STEAMGRIDDB_API_KEY;
  const { appid } = await params;
  const kind = request.nextUrl.searchParams.get("kind") === "hero" ? "hero" : "grid";

  if (!/^\d+$/.test(appid)) {
    return Response.json({ error: "Invalid Steam app ID." }, { status: 400 });
  }

  if (!apiKey) {
    return await steamFallback(appid);
  }

  const endpoint = kind === "hero" ? "heroes" : "grids";
  const query = new URLSearchParams({
    types: "static",
    nsfw: "false",
    humor: "false",
  });

  if (kind === "grid") {
    query.set("dimensions", "920x430,460x215");
  }

  try {
    const response = await fetch(
      `${STEAMGRIDDB_API}/${endpoint}/steam/${appid}?${query}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        next: { revalidate: ARTWORK_CACHE_SECONDS },
      }
    );

    if (!response.ok) {
      return await steamFallback(appid);
    }

    const payload = (await response.json()) as SteamGridDbResponse;
    const artwork = (payload.data ?? [])
      .filter((asset) => asset.url)
      .sort((left, right) => (right.score ?? 0) - (left.score ?? 0))[0];

    if (!payload.success || !artwork) {
      return await steamFallback(appid);
    }

    return (await proxyImage(artwork.url)) ?? (await steamFallback(appid));
  } catch {
    return await steamFallback(appid);
  }
}

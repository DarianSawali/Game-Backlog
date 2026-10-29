import type { SteamLibraryResult } from "@/lib/library-sync";

const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_STORE_BASE = "https://store.steampowered.com/api";
const STEAM_REQUEST_TIMEOUT_MS = 10_000;

class NonRetryableSteamError extends Error {}

export type SteamGame = {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  playtime_2weeks?: number;
};

export type SteamGameMetadata = {
  appid: number;
  name: string;
  type: string;
  shortDescription?: string;
  headerImage?: string;
  capsuleImage?: string;
  developers?: string[];
  publishers?: string[];
  genres?: {
    id: string;
    description: string;
  }[];
  tags?: string[];
  categories?: {
    id: number;
    description: string;
  }[];
  releaseDate?: string;
  controllerSupport?: string;
};

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
  };

  return value.replace(
    /&(?:#(\d+)|#x([\da-f]+)|([a-z]+));/gi,
    (entity, decimal: string, hexadecimal: string, named: string) => {
      if (decimal) return String.fromCodePoint(Number(decimal));
      if (hexadecimal) return String.fromCodePoint(Number.parseInt(hexadecimal, 16));
      return namedEntities[named.toLowerCase()] ?? entity;
    }
  );
}

export function parseSteamStoreTags(html: string) {
  const tags = [...html.matchAll(
    /<div[^>]*class=["'][^"']*\bapp_tag\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi
  )].map((match) =>
    decodeHtmlEntities(match[1].replace(/<[^>]+>/g, "")).trim()
  );

  return [...new Set(tags.filter(Boolean))];
}

async function getSteamStoreTags(appid: number) {
  const url = new URL(`/apphoverpublic/${appid}`, STEAM_STORE_BASE);
  url.searchParams.set("l", "english");

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(STEAM_REQUEST_TIMEOUT_MS),
      next: { revalidate: 86_400 },
    });

    if (!response.ok) return [];
    return parseSteamStoreTags(await response.text());
  } catch {
    return [];
  }
}

export type SteamFriend = {
  steamid: string;
  relationship: string;
  friend_since: number;
};

export type SteamPlayerProfile = {
  steamId: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
};

type SteamLibraryResponse = {
  response?: {
    game_count?: number;
    games?: SteamGame[];
  };
};

type RecentlyPlayedResponse = {
  response?: {
    total_count?: number;
    games?: SteamGame[];
  };
};

type FriendListResponse = {
  friendslist?: {
    friends?: SteamFriend[];
  };
};

type PlayerSummariesResponse = {
  response?: {
    players?: {
      steamid: string;
      personaname: string;
      avatarfull: string;
      profileurl: string;
    }[];
  };
};

type SteamStoreResponse = {
  success: boolean;
  data?: {
    type?: string;
    name?: string;
    short_description?: string;
    header_image?: string;
    capsule_image?: string;
    developers?: string[];
    publishers?: string[];
    genres?: {
      id: string;
      description: string;
    }[];
    categories?: {
      id: number;
      description: string;
    }[];
    release_date?: {
      coming_soon: boolean;
      date: string;
    };
    controller_support?: string;
  };
};

function getSteamApiKey() {
  const apiKey = process.env.STEAM_API_KEY;

  if (!apiKey) throw new Error("STEAM_API_KEY is missing");
  return apiKey;
}

function validateSteamId(steamId: string) {
  const normalized = steamId.trim();
  if (!/^\d{17}$/.test(normalized)) {
    throw new Error("A valid 17-digit Steam ID is required");
  }
  return normalized;
}

function createSteamApiUrl(
  path: string,
  params: Record<string, string>
) {
  const url = new URL(path, STEAM_API_BASE);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url;
}

async function fetchSteamJson<T>(
  url: URL,
  options?: RequestInit,
  retries = 0
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(STEAM_REQUEST_TIMEOUT_MS),
      });

      if (response.ok) {
        return response.json() as Promise<T>;
      }

      lastError = new Error(
        `Steam request failed: ${response.status} ${response.statusText}`
      );

      if (response.status < 500 && response.status !== 429) {
        throw new NonRetryableSteamError(lastError.message);
      }
    } catch (error) {
      if (error instanceof NonRetryableSteamError) {
        throw error;
      }

      lastError =
        error instanceof Error
          ? error
          : new Error("Steam request failed: Unknown network error");
    }

    if (attempt < retries) {
      await new Promise((resolve) =>
        setTimeout(resolve, 200 * 2 ** attempt)
      );
    }
  }

  throw lastError ?? new Error("Steam request failed");
}

export async function getRecentlyPlayedGames(
  steamId: string
): Promise<SteamGame[]> {
  const apiKey = getSteamApiKey();
  const userSteamId = validateSteamId(steamId);

  const url = createSteamApiUrl(
    "/IPlayerService/GetRecentlyPlayedGames/v1/",
    {
      key: apiKey,
      steamid: userSteamId,
      count: "0",
    }
  );

  const data = await fetchSteamJson<RecentlyPlayedResponse>(url, {
    cache: "no-store",
  });

  return data.response?.games ?? [];
}

export async function getOwnedGames(
  steamId: string
): Promise<SteamLibraryResult> {
  const apiKey = getSteamApiKey();
  const userSteamId = validateSteamId(steamId);
  const url = createSteamApiUrl(
    "/IPlayerService/GetOwnedGames/v1/",
    {
      key: apiKey,
      steamid: userSteamId,
      include_appinfo: "true",
      include_played_free_games: "true",
    }
  );
  let data: SteamLibraryResponse;

  try {
    data = await fetchSteamJson<SteamLibraryResponse>(url, {
      cache: "no-store",
    });
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Steam library request failed";

    return {
      status: "failed",
      reason: message.includes("429")
        ? "rate-limited"
        : "steam-unavailable",
      message,
    };
  }

  if (typeof data.response?.game_count !== "number") {
    return { status: "private" };
  }

  return {
    status: "available",
    games: data.response.games ?? [],
  };
}

export async function getGameMetadata(
  appid: number
): Promise<SteamGameMetadata | null> {
  const url = new URL("/api/appdetails", STEAM_STORE_BASE);
  url.searchParams.set("appids", String(appid));
  url.searchParams.set("l", "english");

  let result: Record<string, SteamStoreResponse>;
  const tagsPromise = getSteamStoreTags(appid);

  try {
    result = await fetchSteamJson<Record<string, SteamStoreResponse>>(
      url,
      {
        next: {
          revalidate: 86_400,
        },
      },
      2
    );
  } catch {
    return null;
  }

  const app = result[String(appid)];

  if (!app?.success || !app.data) {
    return null;
  }

  return {
    appid,
    name: app.data.name ?? "Unknown Game",
    type: app.data.type ?? "unknown",
    shortDescription: app.data.short_description,
    headerImage: app.data.header_image,
    capsuleImage: app.data.capsule_image,
    developers: app.data.developers,
    publishers: app.data.publishers,
    genres: app.data.genres,
    tags: await tagsPromise,
    categories: app.data.categories,
    releaseDate: app.data.release_date?.date,
    controllerSupport: app.data.controller_support,
  };
}

export async function getPlayerProfile(
  steamId: string
): Promise<SteamPlayerProfile | null> {
  const apiKey = getSteamApiKey();
  const userSteamId = validateSteamId(steamId);
  const url = createSteamApiUrl(
    "/ISteamUser/GetPlayerSummaries/v2/",
    { key: apiKey, steamids: userSteamId }
  );
  const data = await fetchSteamJson<PlayerSummariesResponse>(url, {
    cache: "no-store",
  });
  const player = data.response?.players?.[0];

  return player ? {
    steamId: player.steamid,
    displayName: player.personaname,
    avatarUrl: player.avatarfull,
    profileUrl: player.profileurl,
  } : null;
}

export async function getFriendList(steamId: string): Promise<SteamFriend[]> {
  const apiKey = getSteamApiKey();
  const userSteamId = validateSteamId(steamId);
  const url = createSteamApiUrl(
    "/ISteamUser/GetFriendList/v1/",
    {
      key: apiKey,
      steamid: userSteamId,
      relationship: "friend",
    }
  );

  const data = await fetchSteamJson<FriendListResponse>(url, {
    cache: "no-store",
  });

  return data.friendslist?.friends ?? [];
}

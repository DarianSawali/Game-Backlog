const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_STORE_BASE = "https://store.steampowered.com/api";
const STEAM_REQUEST_TIMEOUT_MS = 10_000;

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
  categories?: {
    id: number;
    description: string;
  }[];
  releaseDate?: string;
  controllerSupport?: string;
};

export type SteamFriend = {
  steamid: string;
  relationship: string;
  friend_since: number;
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

function getSteamCredentials() {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;

  if (!apiKey || !steamId) {
    throw new Error("Steam environment variables are missing");
  }

  return { apiKey, steamId };
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
  options?: RequestInit
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(STEAM_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown network error";

    throw new Error(`Steam request failed: ${message}`);
  }

  if (!response.ok) {
    throw new Error(
      `Steam request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}

async function fetchRecentlyPlayedGamesForUser(
  steamId: string
): Promise<SteamGame[]> {
  const apiKey = process.env.STEAM_API_KEY;

  if (!apiKey) {
    throw new Error("STEAM_API_KEY is missing");
  }

  const url = createSteamApiUrl(
    "/IPlayerService/GetRecentlyPlayedGames/v1/",
    {
      key: apiKey,
      steamid: steamId,
      count: "0",
    }
  );

  const data = await fetchSteamJson<RecentlyPlayedResponse>(url, {
    cache: "no-store",
  });

  return data.response?.games ?? [];
}

export async function getRecentlyPlayedGamesForUser(
  steamId: string
): Promise<SteamGame[]> {
  try {
    return await fetchRecentlyPlayedGamesForUser(steamId);
  } catch {
    // Private profiles and unavailable friend activity are expected.
    return [];
  }
}

export async function getRecentlyPlayedGames(): Promise<SteamGame[]> {
  const { steamId } = getSteamCredentials();
  return fetchRecentlyPlayedGamesForUser(steamId);
}

export async function getOwnedGames(): Promise<SteamGame[]> {
  const { apiKey, steamId } = getSteamCredentials();
  const url = createSteamApiUrl(
    "/IPlayerService/GetOwnedGames/v1/",
    {
      key: apiKey,
      steamid: steamId,
      include_appinfo: "true",
      include_played_free_games: "true",
    }
  );
  const data = await fetchSteamJson<SteamLibraryResponse>(url, {
    cache: "no-store",
  });

  return data.response?.games ?? [];
}

export async function getGameMetadata(
  appid: number
): Promise<SteamGameMetadata | null> {
  const url = new URL("/api/appdetails", STEAM_STORE_BASE);
  url.searchParams.set("appids", String(appid));
  url.searchParams.set("l", "english");

  let result: Record<string, SteamStoreResponse>;

  try {
    result = await fetchSteamJson<Record<string, SteamStoreResponse>>(url, {
      next: {
        revalidate: 86_400,
      },
    });
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
    categories: app.data.categories,
    releaseDate: app.data.release_date?.date,
    controllerSupport: app.data.controller_support,
  };
}

export async function getFriendList(): Promise<SteamFriend[]> {
  const { apiKey, steamId } = getSteamCredentials();
  const url = createSteamApiUrl(
    "/ISteamUser/GetFriendList/v1/",
    {
      key: apiKey,
      steamid: steamId,
      relationship: "friend",
    }
  );

  const data = await fetchSteamJson<FriendListResponse>(url, {
    cache: "no-store",
  });

  return data.friendslist?.friends ?? [];
}

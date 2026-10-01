export type SteamGame = {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;

  playtime_2weeks?: number;
};

type SteamLibraryResponse = {
  response: {
    game_count: number;
    games: SteamGame[];
  };
};

type RecentlyPlayedResponse = {
  response: {
    total_count: number;
    games: SteamGame[];
  };
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

// export async function getRecentlyPlayedGames(): Promise<SteamGame[]> {
//     const apiKey = process.env.STEAM_API_KEY;
//     const steamId = process.env.STEAM_ID;

//     if(!apiKey){
//         throw new Error("Steam environment variables are missing");
//     }

//     const url = `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/` +
//     `?key=${apiKey}` +
//     `&steamid=${steamId}` +
//     `&count=0`;

//     const response = await fetch(url, {
//         cache: "no-store",
//     });

//     if (!response.ok) {
//         throw new Error("Failed to fetch recently played games");
//     }

//     const data: RecentlyPlayedResponse = await response.json();

//     return data.response.games ?? [];
// }



export async function getRecentlyPlayedGamesForUser(
  steamId: string
): Promise<SteamGame[]> {
  const apiKey = process.env.STEAM_API_KEY;

  if (!apiKey) {
    throw new Error("STEAM_API_KEY is missing");
  }

  const url =
    `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/` +
    `?key=${apiKey}` +
    `&steamid=${steamId}` +
    `&count=0`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const data: RecentlyPlayedResponse = await response.json();

  return data.response.games ?? [];
}


export async function getRecentlyPlayedGames(): Promise<SteamGame[]> {
  const steamId = process.env.STEAM_ID;

  if (!steamId) {
    throw new Error("STEAM_ID is missing");
  }

  return getRecentlyPlayedGamesForUser(steamId);
}



export async function getOwnedGames(): Promise<SteamGame[]> {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;

  if (!apiKey) {
    throw new Error('STEAM_API_KEY is not set');

  }

  if (!steamId) {
    throw new Error('STEAM_ID is not set');
  }

  const url =
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/` +
    `?key=${apiKey}` +
    `&steamid=${steamId}` +
    `&include_appinfo=true` +
    `&include_played_free_games=true`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();

    console.error("Steam API error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
    });

    throw new Error(
      `Steam API failed: ${response.status} ${response.statusText}`
    );
  }

  const data: SteamLibraryResponse = await response.json();
  return data.response.games ?? [];

}



export async function getGameMetadata(
  appid: number
): Promise<SteamGameMetadata | null> {
  const url =
    `https://store.steampowered.com/api/appdetails` +
    `?appids=${appid}` +
    `&l=english`;

  const response = await fetch(url, {
    next: {
      revalidate: 86400,
    },
  });

  if (!response.ok) {
    console.error(
      `Failed to fetch metadata for Steam app ${appid}`
    );

    return null;
  }

  const result = await response.json();

  const app = result[String(appid)] as
    | SteamStoreResponse
    | undefined;

  if (!app?.success || !app.data) {
    return null;
  }

  return {
    appid,
    name: app.data.name ?? "Unknown Game",
    type: app.data.type ?? "unknown",

    shortDescription:
      app.data.short_description,

    headerImage:
      app.data.header_image,

    capsuleImage:
      app.data.capsule_image,

    developers:
      app.data.developers,

    publishers:
      app.data.publishers,

    genres:
      app.data.genres,

    categories:
      app.data.categories,

    releaseDate:
      app.data.release_date?.date,

    controllerSupport:
      app.data.controller_support,
  };
}

// export type SteamFriend = {
//   steamid: string;
//   personaname: string;
//   profileurl: string;
//   avatar: string;
//   avatarmedium: string;
//   avatarfull: string;
//   lastlogoff: number;
//   commentpermission: number;
// };


export type SteamFriend = {
  steamid: string;
  relationship: string;
  friend_since: number;
};

type FriendListResponse = {
  friendslist?: {
    friends: SteamFriend[];
  };
};

export async function getFriendList(): Promise<SteamFriend[]> {
  const apiKey = process.env.STEAM_API_KEY;
  const steamId = process.env.STEAM_ID;

  if (!apiKey || !steamId) {
    throw new Error("Steam environment variables are missing");
  }

  const url =
    `https://api.steampowered.com/ISteamUser/GetFriendList/v1/` +
    `?key=${apiKey}` +
    `&steamid=${steamId}` +
    `&relationship=friend`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();

    console.warn(
      `Steam friend list unavailable: ${response.status} ${response.statusText}`,
      body
    );

    return [];
  }

  const data: FriendListResponse =
    await response.json();

  return data.friendslist?.friends ?? [];
}

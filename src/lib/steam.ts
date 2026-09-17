export type SteamGame = {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
};

type SteamLibraryResponse = {
    response: {
        game_count: number;
        games: SteamGame[];
    };
};

export async function getOwnedGames(): Promise<SteamGame[]> {
    const apiKey = process.env.STEAM_API_KEY;
    const steamId = process.env.STEAM_ID;

    if(!apiKey){
        throw new Error('STEAM_API_KEY is not set');

    }

    if(!steamId){
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



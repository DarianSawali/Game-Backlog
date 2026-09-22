import {SteamGame} from '@/lib/steam';

export type RecommendationCategory =
| "unplayed"
| "barelyPlayed"
| "forgotten"
| "recentlyPlayed"
| "all";

export function getUnplayedGames(games: SteamGame[]) {
    return games.filter(game => game.playtime_forever === 0);
}

export function getBarelyPlayedGames(games: SteamGame[]) {
    return games.filter(
        (games) =>
        games.playtime_forever > 0 && games.playtime_forever < 120
    );
}

export function getForgottenGames(
    games: SteamGame[],
    recentGames: SteamGame[],
) {
    const recentGamesIds = new Set(
        recentGames.map(game => game.appid)
    );

    return games.filter(
        (games) =>
            games.playtime_forever >= 120 &&
            !recentGamesIds.has(games.appid)
    );
}


export function getRecentlyPlayedGames(
    games: SteamGame[],
    recentGames: SteamGame[],
) {
    const recentGamesIds = new Set(
        recentGames.map(game => game.appid)
    );

    return games.filter((game) =>
        recentGamesIds.has(game.appid)
    );
}

export function getGamesByCategory(
    category: RecommendationCategory,
    games: SteamGame[],
    recentGames: SteamGame[]
  ) {
    switch (category) {
      case "unplayed":
        return getUnplayedGames(games);
  
      case "barelyPlayed":
        return getBarelyPlayedGames(games);
  
      case "forgotten":
        return getForgottenGames(games, recentGames);
  
      case "recentlyPlayed":
        return getRecentlyPlayedGames(games, recentGames);
  
      case "all":
      default:
        return games;
    }
  }


export function getRandomGame(
    games: SteamGame[],
    currentGame?: SteamGame | null
  ) {
    if (games.length === 0) {
      return null;
    }
  
    let availableGames = games;
  
    if (currentGame && games.length > 1) {
      availableGames = games.filter(
        (game) => game.appid !== currentGame.appid
      );
    }
  
    const randomIndex = Math.floor(
      Math.random() * availableGames.length
    );
  
    return availableGames[randomIndex];
  }
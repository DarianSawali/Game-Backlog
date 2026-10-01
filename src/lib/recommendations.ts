import {
  SteamGame,
  SteamGameMetadata,
} from "@/lib/steam";

export type EnrichedGame = {
  game: SteamGame;
  metadata: SteamGameMetadata | null;
  score: number;
};

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

  export function getRecommendationReason(
    category: RecommendationCategory,
    game: SteamGame
  ) {
    switch (category) {
      case "unplayed":
        return "You haven't played this game yet.";

      case "barelyPlayed":
        return `You've only played this for ${(game.playtime_forever / 60).toFixed(1)} hours.`;

      case "forgotten":
        return "You've played this before, but not recently.";

      case "recentlyPlayed":
        return "You've been playing this recently.";

      case "all":
      default:
        return "Randomly selected from your Steam library.";
    }
  }

  export function calculateGameScore(
    game: SteamGame,
    metadata: SteamGameMetadata | null,
    recentGameIds: Set<number>,
    genreProfile: Map<string, number>
  ) {
    let score = 0;

    if (game.playtime_forever === 0) {
      score += 30;
    }

    if (
      game.playtime_forever > 0 &&
      game.playtime_forever < 120
    ) {
      score += 20;
    }

    if (
      game.playtime_forever >= 120 &&
      !recentGameIds.has(game.appid)
    ) {
      score += 10;
    }

    if (metadata?.type === "game") {
      score += 15;
    }

    for (const genre of metadata?.genres ?? []) {
      const genreWeight =
        genreProfile.get(genre.description) ?? 0;

      score += genreWeight * 5;
    }

    return score;
  }

  export function getCandidateGames(
    games: SteamGame[],
    limit = 12
  ) {
    const shuffled = [...games].sort(
      () => Math.random() - 0.5
    );

    return shuffled.slice(0, limit);
  }

  export function getTopRecommendation(
    games: EnrichedGame[],
    currentGame?: SteamGame | null
  ) {
    if (games.length === 0) {
      return null;
    }

    let availableGames = games;

    if (currentGame && games.length > 1) {
      availableGames = games.filter(
        ({ game }) =>
          game.appid !== currentGame.appid
      );
    }

    const sortedGames = [...availableGames].sort(
      (a, b) => b.score - a.score
    );

    // Don't always return the exact highest scoring game.
    const topGames = sortedGames.slice(0, 5);

    const randomIndex = Math.floor(
      Math.random() * topGames.length
    );

    return topGames[randomIndex] ?? null;
  }

  export function buildGenreProfile(
    recentMetadata: SteamGameMetadata[]
  ) {
    const genreCounts = new Map<string, number>();

    for (const metadata of recentMetadata) {
      for (const genre of metadata.genres ?? []) {
        const current = genreCounts.get(genre.description) ?? 0;

        genreCounts.set(
          genre.description,
          current + 1
        );
      }
    }

    return genreCounts;
  }

import {
  SteamGame,
  SteamGameMetadata,
} from "@/lib/steam";

export type RecommendationCategory =
  | "unplayed"
  | "barelyPlayed"
  | "forgotten"
  | "recentlyPlayed"
  | "friendsPlaying"
  | "all";

export type RecommendationScore = {
  score: number;
  reasons: string[];
};

export type EnrichedGame = RecommendationScore & {
  game: SteamGame;
  metadata: SteamGameMetadata | null;
};

export function getUnplayedGames(games: SteamGame[]) {
  return games.filter((game) => game.playtime_forever === 0);
}

export function getBarelyPlayedGames(games: SteamGame[]) {
  return games.filter(
    (game) =>
      game.playtime_forever > 0 && game.playtime_forever < 120
  );
}

export function getForgottenGames(
  games: SteamGame[],
  recentGames: SteamGame[]
) {
  const recentGameIds = new Set(
    recentGames.map((game) => game.appid)
  );

  return games.filter(
    (game) =>
      game.playtime_forever >= 120 &&
      !recentGameIds.has(game.appid)
  );
}

export function getRecentlyPlayedGames(
  games: SteamGame[],
  recentGames: SteamGame[]
) {
  const recentGameIds = new Set(
    recentGames.map((game) => game.appid)
  );

  return games.filter((game) => recentGameIds.has(game.appid));
}

export function getGamesByCategory(
  category: RecommendationCategory,
  games: SteamGame[],
  recentGames: SteamGame[],
  friendActivityMap?: Map<number, number>
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
    case "friendsPlaying":
      return games.filter(
        (game) =>
          (friendActivityMap?.get(game.appid) ?? 0) > 0
      );
    case "all":
    default:
      return games;
  }
}

export function getRecommendationReason(
  category: RecommendationCategory,
  game: SteamGame
) {
  switch (category) {
    case "unplayed":
      return "You haven't played this game yet.";
    case "barelyPlayed":
      return `You've only played this for ${(
        game.playtime_forever / 60
      ).toFixed(1)} hours.`;
    case "forgotten":
      return "You've played this before, but not recently.";
    case "recentlyPlayed":
      return "You've been playing this recently.";
    case "friendsPlaying":
      return "Your friends have been playing this recently.";
    case "all":
    default:
      return "Selected from your Steam library.";
  }
}

export function scoreGameRecommendation(
  game: SteamGame,
  metadata: SteamGameMetadata | null,
  recentGameIds: Set<number>,
  genreProfile: Map<string, number>,
  friendActivityMap: Map<number, number>
): RecommendationScore {
  let score = 0;
  const reasons: string[] = [];

  if (game.playtime_forever === 0) {
    score += 30;
    reasons.push("It is still unplayed.");
  } else if (game.playtime_forever < 120) {
    score += 20;
    reasons.push("You have barely played it.");
  } else if (!recentGameIds.has(game.appid)) {
    score += 10;
    reasons.push("It has been out of your rotation.");
  }

  if (metadata?.type === "game") {
    score += 15;
  }

  const matchingGenres = (metadata?.genres ?? [])
    .map((genre) => ({
      name: genre.description,
      weight: Math.min(genreProfile.get(genre.description) ?? 0, 3),
    }))
    .filter((genre) => genre.weight > 0);
  const genreBonus = Math.min(
    matchingGenres.reduce(
      (total, genre) => total + genre.weight * 5,
      0
    ),
    30
  );

  if (genreBonus > 0) {
    score += genreBonus;
    const genreNames = matchingGenres
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2)
      .map((genre) => genre.name);
    reasons.push(
      `It matches genres you play: ${genreNames.join(", ")}.`
    );
  }

  const friendsPlaying = friendActivityMap.get(game.appid) ?? 0;

  if (friendsPlaying > 0) {
    score += Math.min(friendsPlaying, 3) * 10;
    reasons.push(
      `${friendsPlaying} ${
        friendsPlaying === 1 ? "friend has" : "friends have"
      } played it recently.`
    );
  }

  return { score, reasons };
}

export function getCandidateGames(
  games: SteamGame[],
  limit = 12
) {
  const shuffled = [...games];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled.slice(0, limit);
}

export function getTopRecommendation(
  games: EnrichedGame[],
  currentGame?: SteamGame | null
) {
  const availableGames = currentGame && games.length > 1
    ? games.filter(({ game }) => game.appid !== currentGame.appid)
    : games;

  if (availableGames.length === 0) {
    return null;
  }

  const topGames = [...availableGames]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  const lowestTopScore = topGames.at(-1)?.score ?? 0;
  const weightedGames = topGames.map((game) => ({
    game,
    weight: Math.max(game.score - lowestTopScore + 1, 1),
  }));
  const totalWeight = weightedGames.reduce(
    (total, entry) => total + entry.weight,
    0
  );
  let selection = Math.random() * totalWeight;

  for (const entry of weightedGames) {
    selection -= entry.weight;

    if (selection <= 0) {
      return entry.game;
    }
  }

  return weightedGames[0].game;
}

export function buildGenreProfile(
  recentMetadata: SteamGameMetadata[]
) {
  const genreCounts = new Map<string, number>();

  for (const metadata of recentMetadata) {
    for (const genre of metadata.genres ?? []) {
      genreCounts.set(
        genre.description,
        (genreCounts.get(genre.description) ?? 0) + 1
      );
    }
  }

  return genreCounts;
}

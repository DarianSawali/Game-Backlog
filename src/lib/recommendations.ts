import type {
  BacklogPriority,
  BacklogStatus,
} from "@/lib/backlog";
import type { SteamGame, SteamGameMetadata } from "@/lib/steam";

export type RecommendationMode =
  | "backlog"
  | "continue"
  | "new"
  | "quick"
  | "friends";

export const RECOMMENDATION_MODES: {
  value: RecommendationMode;
  label: string;
  description: string;
}[] = [
  {
    value: "backlog",
    label: "Pick from my backlog",
    description: "Choose from games you marked to play, resume, or continue.",
  },
  {
    value: "continue",
    label: "Continue something",
    description: "Return to an active, paused, or recently played game.",
  },
  {
    value: "new",
    label: "Try something new",
    description: "Choose a game with no recorded playtime.",
  },
  {
    value: "quick",
    label: "Quick game",
    description: "Choose something with less than two hours played.",
  },
  {
    value: "friends",
    label: "Friends are playing",
    description: "Choose a game your friends played recently.",
  },
];

export type ScoreBreakdownItem = {
  label: string;
  points: number;
};

export type RecommendationScore = {
  score: number;
  breakdown: ScoreBreakdownItem[];
};

export type EnrichedGame = RecommendationScore & {
  game: SteamGame;
  metadata: SteamGameMetadata | null;
};

export function getGamesForMode(
  mode: RecommendationMode,
  games: SteamGame[],
  recentGames: SteamGame[],
  friendActivityMap: Map<number, number>,
  statuses: Record<string, BacklogStatus>,
  rejectedGameIds: ReadonlySet<number> = new Set()
) {
  const recentGameIds = new Set(recentGames.map((game) => game.appid));
  const eligibleGames = games.filter((game) => {
    const status = statuses[String(game.appid)];
    return (
      status !== "completed" &&
      status !== "dropped" &&
      !rejectedGameIds.has(game.appid)
    );
  });

  switch (mode) {
    case "backlog":
      return eligibleGames.filter((game) => {
        const status = statuses[String(game.appid)];
        return status === "wantToPlay" || status === "playing" || status === "paused";
      });
    case "continue":
      return eligibleGames.filter((game) => {
        const status = statuses[String(game.appid)];
        return (
          game.playtime_forever > 0 &&
          (status === "playing" ||
            status === "paused" ||
            recentGameIds.has(game.appid))
        );
      });
    case "new":
      return eligibleGames.filter((game) => game.playtime_forever === 0);
    case "quick":
      return eligibleGames.filter(
        (game) => game.playtime_forever < 120
      );
    case "friends":
      return eligibleGames.filter(
        (game) => (friendActivityMap.get(game.appid) ?? 0) > 0
      );
  }
}

export function isRecommendableGame(
  metadata: SteamGameMetadata | null
) {
  return metadata === null || metadata.type === "game";
}

export function getRecommendationModeDescription(mode: RecommendationMode) {
  return RECOMMENDATION_MODES.find((option) => option.value === mode)?.description ?? "";
}

export function scoreGameRecommendation(
  mode: RecommendationMode,
  game: SteamGame,
  metadata: SteamGameMetadata | null,
  recentGameIds: Set<number>,
  genreProfile: Map<string, number>,
  friendActivityMap: Map<number, number>,
  statuses: Record<string, BacklogStatus> = {},
  priorities: Record<string, BacklogPriority> = {}
): RecommendationScore {
  const breakdown: ScoreBreakdownItem[] = [];
  const status = statuses[String(game.appid)];
  const priority = priorities[String(game.appid)];

  function addScore(label: string, points: number) {
    breakdown.push({ label, points });
  }

  const modeMatches = {
    backlog:
      status === "wantToPlay" || status === "playing" || status === "paused",
    continue:
      game.playtime_forever > 0 &&
      (status === "playing" || status === "paused" || recentGameIds.has(game.appid)),
    new: game.playtime_forever === 0,
    quick: game.playtime_forever < 120,
    friends: (friendActivityMap.get(game.appid) ?? 0) > 0,
  }[mode];

  if (modeMatches) {
    addScore("Strong match for this recommendation mode", 25);
  }

  if (status === "playing") {
    addScore("Already in progress", 35);
  } else if (status === "wantToPlay") {
    addScore("On your want-to-play list", 25);
  } else if (status === "paused") {
    addScore("Ready to resume", 15);
  }

  if (priority) {
    const priorityBonus = { high: 20, medium: 10, low: 5 }[priority];
    addScore(`${priority[0].toUpperCase() + priority.slice(1)} priority`, priorityBonus);
  }

  if (recentGameIds.has(game.appid)) {
    addScore("Played recently", 15);
  } else if (game.playtime_forever === 0) {
    addScore("Still unplayed", 30);
  } else if (game.playtime_forever < 120) {
    addScore("Less than two hours played", 20);
  } else {
    addScore("Out of your recent rotation", 10);
  }

  const matchingGenres = (metadata?.genres ?? [])
    .map((genre) => ({
      name: genre.description,
      weight: Math.min(genreProfile.get(genre.description) ?? 0, 3),
    }))
    .filter((genre) => genre.weight > 0);
  const genreBonus = Math.min(
    matchingGenres.reduce((total, genre) => total + genre.weight * 5, 0),
    30
  );

  if (genreBonus > 0) {
    const genreNames = matchingGenres
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2)
      .map((genre) => genre.name);
    addScore(`Matches your genres: ${genreNames.join(", ")}`, genreBonus);
  }

  const friendsPlaying = friendActivityMap.get(game.appid) ?? 0;

  if (friendsPlaying > 0) {
    addScore(
      `${friendsPlaying} ${friendsPlaying === 1 ? "friend has" : "friends have"} played it recently`,
      Math.min(friendsPlaying, 3) * 10
    );
  }

  return {
    score: breakdown.reduce((total, item) => total + item.points, 0),
    breakdown,
  };
}

export function getCandidateGames(
  games: SteamGame[],
  limit = 24
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

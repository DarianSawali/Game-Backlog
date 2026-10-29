import type { UserGameData } from "@/lib/backlog";
import type { SteamGame } from "@/lib/steam";

export type SteamLibraryResult =
  | { status: "available"; games: SteamGame[] }
  | { status: "private" }
  | {
      status: "failed";
      reason: "rate-limited" | "steam-unavailable";
      message: string;
    };

export type SyncedSteamGame = SteamGame & {
  availability: "available" | "unavailable";
  lastSeenAt: string;
};

export type LibrarySyncState = {
  steamGames: SyncedSteamGame[];
  userGames: Record<string, UserGameData>;
};

type SyncChanges = {
  added: number;
  updated: number;
  markedUnavailable: number;
};

export type LibrarySyncResult =
  | {
      status: "success";
      state: LibrarySyncState;
      changes: SyncChanges;
      syncedAt: string;
    }
  | {
      status: "private";
      state: LibrarySyncState;
      changes: SyncChanges;
    }
  | {
      status: "failed";
      state: LibrarySyncState;
      changes: SyncChanges;
      reason: Extract<SteamLibraryResult, { status: "failed" }>["reason"];
      message: string;
    };

const noChanges: SyncChanges = {
  added: 0,
  updated: 0,
  markedUnavailable: 0,
};

function hasSteamGameChanged(
  current: SyncedSteamGame,
  incoming: SteamGame
) {
  return (
    current.name !== incoming.name ||
    current.playtime_forever !== incoming.playtime_forever ||
    current.playtime_2weeks !== incoming.playtime_2weeks ||
    current.img_icon_url !== incoming.img_icon_url ||
    current.availability !== "available"
  );
}

export function synchronizeLibrary(
  current: LibrarySyncState,
  steamResult: SteamLibraryResult,
  syncedAt: string
): LibrarySyncResult {
  if (steamResult.status === "private") {
    return {
      status: "private",
      state: current,
      changes: noChanges,
    };
  }

  if (steamResult.status === "failed") {
    return {
      status: "failed",
      state: current,
      changes: noChanges,
      reason: steamResult.reason,
      message: steamResult.message,
    };
  }

  const existingById = new Map(
    current.steamGames.map((game) => [game.appid, game])
  );
  const incomingById = new Map<number, SteamGame>();

  for (const game of steamResult.games) {
    incomingById.set(game.appid, game);
  }

  let added = 0;
  let updated = 0;
  let markedUnavailable = 0;
  const steamGames: SyncedSteamGame[] = [];

  for (const game of incomingById.values()) {
    const existing = existingById.get(game.appid);

    if (!existing) {
      added += 1;
    } else if (hasSteamGameChanged(existing, game)) {
      updated += 1;
    }

    steamGames.push({
      ...game,
      availability: "available",
      lastSeenAt: syncedAt,
    });
  }

  for (const existing of existingById.values()) {
    if (incomingById.has(existing.appid)) continue;

    if (existing.availability === "available") {
      markedUnavailable += 1;
    }

    steamGames.push({
      ...existing,
      availability: "unavailable",
    });
  }

  return {
    status: "success",
    state: {
      steamGames,
      // Synchronization deliberately has no write path for app-owned fields.
      userGames: current.userGames,
    },
    changes: { added, updated, markedUnavailable },
    syncedAt,
  };
}

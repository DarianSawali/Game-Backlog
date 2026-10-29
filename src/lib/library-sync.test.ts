import { describe, expect, it } from "vitest";
import type { UserGameData } from "@/lib/backlog";
import {
  synchronizeLibrary,
  type LibrarySyncState,
  type SyncedSteamGame,
} from "@/lib/library-sync";
import type { SteamGame } from "@/lib/steam";

const firstSync = "2026-10-26T10:00:00.000Z";
const nextSync = "2026-10-27T10:00:00.000Z";

function steamGame(appid: number, playtime = 0): SteamGame {
  return {
    appid,
    name: `Game ${appid}`,
    playtime_forever: playtime,
    img_icon_url: `icon-${appid}`,
  };
}

function syncedGame(
  appid: number,
  playtime = 0,
  availability: SyncedSteamGame["availability"] = "available"
): SyncedSteamGame {
  return {
    ...steamGame(appid, playtime),
    availability,
    lastSeenAt: firstSync,
  };
}

function userGame(appId: number): UserGameData {
  return {
    appId,
    status: "playing",
    priority: "high",
    rating: 5,
    notes: "Keep this note",
    hidden: true,
    rejectedAt: "2026-10-25T10:00:00.000Z",
    statusChangedAt: "2026-10-24T10:00:00.000Z",
  };
}

function state(games: SyncedSteamGame[] = [syncedGame(1, 10)]): LibrarySyncState {
  return {
    steamGames: games,
    userGames: { "1": userGame(1) },
  };
}

describe("synchronizeLibrary", () => {
  it("updates Steam fields without touching app-owned data", () => {
    const current = state();
    const result = synchronizeLibrary(
      current,
      { status: "available", games: [steamGame(1, 90)] },
      nextSync
    );

    expect(result.status).toBe("success");
    expect(result.state.steamGames[0]).toMatchObject({
      appid: 1,
      playtime_forever: 90,
      availability: "available",
      lastSeenAt: nextSync,
    });
    expect(result.state.userGames).toBe(current.userGames);
    expect(result.state.userGames["1"]).toEqual(userGame(1));
  });

  it("adds games once, deduplicates snapshots, and is idempotent", () => {
    const snapshot = {
      status: "available" as const,
      games: [steamGame(1, 10), steamGame(2), steamGame(2)],
    };
    const first = synchronizeLibrary(state(), snapshot, nextSync);
    const second = synchronizeLibrary(first.state, snapshot, nextSync);

    expect(first.state.steamGames.map((game) => game.appid)).toEqual([1, 2]);
    expect(first.changes.added).toBe(1);
    expect(second.state).toEqual(first.state);
    expect(second.changes).toEqual({
      added: 0,
      updated: 0,
      markedUnavailable: 0,
    });
  });

  it("marks missing games unavailable only after an available snapshot", () => {
    const result = synchronizeLibrary(
      state([syncedGame(1), syncedGame(2)]),
      { status: "available", games: [steamGame(1)] },
      nextSync
    );

    expect(result.state.steamGames.find((game) => game.appid === 2))
      .toMatchObject({ availability: "unavailable", lastSeenAt: firstSync });
    expect(result.changes.markedUnavailable).toBe(1);
  });

  it.each([
    { status: "private" as const },
    {
      status: "failed" as const,
      reason: "steam-unavailable" as const,
      message: "Steam is unavailable",
    },
  ])("preserves all existing data for a $status result", (steamResult) => {
    const current = state([syncedGame(1), syncedGame(2)]);
    const result = synchronizeLibrary(current, steamResult, nextSync);

    expect(result.state).toBe(current);
    expect(result.changes).toEqual({
      added: 0,
      updated: 0,
      markedUnavailable: 0,
    });
  });

  it("restores an unavailable game when it reappears", () => {
    const result = synchronizeLibrary(
      state([syncedGame(1, 10, "unavailable")]),
      { status: "available", games: [steamGame(1, 20)] },
      nextSync
    );

    expect(result.state.steamGames[0]).toMatchObject({
      availability: "available",
      playtime_forever: 20,
    });
    expect(result.changes.updated).toBe(1);
  });
});

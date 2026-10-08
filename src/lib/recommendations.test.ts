import { describe, expect, it } from "vitest";
import {
  getGamesForMode,
  isRecommendableGame,
  scoreGameRecommendation,
} from "@/lib/recommendations";
import type { SteamGame, SteamGameMetadata } from "@/lib/steam";

const game: SteamGame = {
  appid: 10,
  name: "Test Game",
  playtime_forever: 0,
  img_icon_url: "",
};
const playedGame: SteamGame = {
  ...game,
  appid: 11,
  name: "Played Game",
  playtime_forever: 600,
};

describe("recommendation modes", () => {
  it("picks active statuses for backlog mode", () => {
    const result = getGamesForMode(
      "backlog",
      [game, playedGame],
      [],
      new Map(),
      { "10": "wantToPlay", "11": "completed" }
    );

    expect(result).toEqual([game]);
  });

  it("continues active or recent played games", () => {
    const paused = { ...playedGame, appid: 12 };
    const result = getGamesForMode(
      "continue",
      [game, playedGame, paused],
      [playedGame],
      new Map(),
      { "12": "paused" }
    );

    expect(result).toEqual([playedGame, paused]);
  });

  it("finds unplayed games for new mode", () => {
    expect(
      getGamesForMode("new", [game, playedGame], [], new Map(), {})
    ).toEqual([game]);
  });

  it("finds games below two hours for quick mode", () => {
    const shortGame = { ...game, appid: 12, playtime_forever: 119 };
    expect(
      getGamesForMode(
        "quick",
        [game, shortGame, playedGame],
        [],
        new Map(),
        {}
      )
    ).toEqual([game, shortGame]);
  });

  it("finds games with friend activity", () => {
    expect(
      getGamesForMode(
        "friends",
        [game, playedGame],
        [],
        new Map([[playedGame.appid, 2]]),
        {}
      )
    ).toEqual([playedGame]);
  });

  it("excludes completed, dropped, and recently rejected games", () => {
    const dropped = { ...game, appid: 12 };
    const result = getGamesForMode(
      "new",
      [game, dropped, { ...game, appid: 13 }],
      [],
      new Map(),
      { "10": "completed", "12": "dropped" },
      new Set([13])
    );

    expect(result).toEqual([]);
  });
});

describe("metadata eligibility", () => {
  it("allows games and unknown metadata but excludes identified non-games", () => {
    expect(isRecommendableGame(null)).toBe(true);
    expect(
      isRecommendableGame({ appid: 10, name: "Game", type: "game" })
    ).toBe(true);
    expect(
      isRecommendableGame({ appid: 11, name: "DLC", type: "dlc" })
    ).toBe(false);
    expect(
      isRecommendableGame({ appid: 12, name: "Tool", type: "software" })
    ).toBe(false);
  });
});

describe("recommendation scoring", () => {
  function score(
    overrides: Partial<SteamGame> = {},
    options: {
      mode?: "backlog" | "continue" | "new" | "quick" | "friends";
      metadata?: SteamGameMetadata | null;
      recent?: Set<number>;
      genres?: Map<string, number>;
      friends?: Map<number, number>;
      status?: "wantToPlay" | "playing" | "completed" | "paused" | "dropped";
      priority?: "low" | "medium" | "high";
    } = {}
  ) {
    const target = { ...game, ...overrides };
    return scoreGameRecommendation(
      options.mode ?? "new",
      target,
      options.metadata ?? null,
      options.recent ?? new Set(),
      options.genres ?? new Map(),
      options.friends ?? new Map(),
      options.status ? { [target.appid]: options.status } : {},
      options.priority ? { [target.appid]: options.priority } : {}
    );
  }

  it("adds a mode-match score", () => {
    expect(score().breakdown).toContainEqual({
      label: "Strong match for this recommendation mode",
      points: 25,
    });
  });

  it.each([
    ["playing", 35, "Already in progress"],
    ["wantToPlay", 25, "On your want-to-play list"],
    ["paused", 15, "Ready to resume"],
  ] as const)("scores %s backlog status", (status, points, label) => {
    expect(score({}, { status }).breakdown).toContainEqual({ label, points });
  });

  it.each([
    ["high", 20],
    ["medium", 10],
    ["low", 5],
  ] as const)("scores %s priority", (priority, points) => {
    expect(score({}, { priority }).breakdown).toContainEqual({
      label: `${priority[0].toUpperCase() + priority.slice(1)} priority`,
      points,
    });
  });

  it("scores recent activity instead of an inactivity bonus", () => {
    const result = score(
      { playtime_forever: 600 },
      { mode: "continue", recent: new Set([game.appid]) }
    );

    expect(result.breakdown).toContainEqual({ label: "Played recently", points: 15 });
    expect(result.breakdown.some((item) => item.label.includes("rotation"))).toBe(false);
  });

  it.each([
    [0, "Still unplayed", 30],
    [60, "Less than two hours played", 20],
    [600, "Out of your recent rotation", 10],
  ] as const)("scores playtime %s", (playtime, label, points) => {
    expect(score({ playtime_forever: playtime }).breakdown).toContainEqual({
      label,
      points,
    });
  });

  it("scores matching genres and caps their bonus", () => {
    const metadata: SteamGameMetadata = {
      appid: game.appid,
      name: game.name,
      type: "game",
      genres: [
        { id: "1", description: "Action" },
        { id: "2", description: "RPG" },
        { id: "3", description: "Strategy" },
      ],
    };
    const result = score({}, {
      metadata,
      genres: new Map([
        ["Action", 10],
        ["RPG", 10],
        ["Strategy", 10],
      ]),
    });

    expect(result.breakdown).toContainEqual({
      label: "Matches your genres: Action, RPG",
      points: 30,
    });
  });

  it("scores friend activity and caps it at three friends", () => {
    const result = score({}, { friends: new Map([[game.appid, 5]]) });

    expect(result.breakdown).toContainEqual({
      label: "5 friends have played it recently",
      points: 30,
    });
  });

  it("returns a total equal to all visible breakdown points", () => {
    const result = score({}, { status: "wantToPlay", priority: "high" });
    expect(result.score).toBe(
      result.breakdown.reduce((total, item) => total + item.points, 0)
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  getGamesByCategory,
  scoreGameRecommendation,
} from "@/lib/recommendations";
import { SteamGame, SteamGameMetadata } from "@/lib/steam";

const game: SteamGame = {
  appid: 10,
  name: "Test Game",
  playtime_forever: 0,
  img_icon_url: "",
};

describe("recommendation categories", () => {
  it("filters games being played by friends", () => {
    const otherGame = { ...game, appid: 11, name: "Other" };
    const result = getGamesByCategory(
      "friendsPlaying",
      [game, otherGame],
      [],
      new Map([[11, 2]])
    );

    expect(result).toEqual([otherGame]);
  });
});

describe("scoreGameRecommendation", () => {
  it("scores and explains playtime, genres, and friend activity", () => {
    const metadata: SteamGameMetadata = {
      appid: game.appid,
      name: game.name,
      type: "game",
      genres: [{ id: "1", description: "Action" }],
    };
    const result = scoreGameRecommendation(
      game,
      metadata,
      new Set(),
      new Map([["Action", 10]]),
      new Map([[game.appid, 5]])
    );

    expect(result.score).toBe(90);
    expect(result.reasons).toEqual([
      "It is still unplayed.",
      "It matches genres you play: Action.",
      "5 friends have played it recently.",
    ]);
  });

  it("does not award a forgotten bonus to recent games", () => {
    const playedGame = { ...game, playtime_forever: 600 };
    const result = scoreGameRecommendation(
      playedGame,
      null,
      new Set([playedGame.appid]),
      new Map(),
      new Map()
    );

    expect(result).toEqual({ score: 0, reasons: [] });
  });

  it("adds backlog status and priority to the score", () => {
    const result = scoreGameRecommendation(
      game,
      null,
      new Set(),
      new Map(),
      new Map(),
      { [game.appid]: "wantToPlay" },
      { [game.appid]: "high" }
    );

    expect(result.score).toBe(75);
    expect(result.reasons).toContain(
      "It is on your want-to-play list."
    );
    expect(result.reasons).toContain("High backlog priority.");
  });

  it("excludes completed and dropped games from general categories", () => {
    const droppedGame = { ...game, appid: 12 };
    const result = getGamesByCategory(
      "all",
      [game, droppedGame],
      [],
      new Map(),
      { "10": "completed", "12": "dropped" }
    );

    expect(result).toEqual([]);
  });
});

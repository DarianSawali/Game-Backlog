import { describe, expect, it } from "vitest";
import {
  createUserGameIndexes,
  type UserGameData,
} from "@/lib/backlog";

function createGame(
  appId: number,
  update: Partial<UserGameData> = {}
): UserGameData {
  return {
    appId,
    status: null,
    priority: null,
    rating: null,
    notes: "",
    hidden: false,
    rejectedAt: null,
    statusChangedAt: null,
    ...update,
  };
}

describe("unified user-game indexes", () => {
  it("derives legacy filtering indexes from UserGameData", () => {
    const indexes = createUserGameIndexes({
      "10": createGame(10, {
        status: "playing",
        priority: "high",
        rating: 5,
        hidden: true,
        statusChangedAt: "2026-10-27T10:00:00.000Z",
      }),
    });

    expect(indexes.statuses).toEqual({ "10": "playing" });
    expect(indexes.priorities).toEqual({ "10": "high" });
    expect(indexes.ratings).toEqual({ "10": 5 });
    expect(indexes.statusDates).toEqual({
      "10": "2026-10-27T10:00:00.000Z",
    });
    expect(indexes.hiddenGameIds).toEqual(new Set([10]));
  });

  it("keeps only the five most recently rejected games", () => {
    const games = Object.fromEntries(
      Array.from({ length: 7 }, (_, index) => {
        const appId = index + 1;
        return [String(appId), createGame(appId, {
          rejectedAt: `2026-10-${String(appId).padStart(2, "0")}T10:00:00.000Z`,
        })];
      })
    );

    expect([...createUserGameIndexes(games).rejectedGameIds]).toEqual([
      7, 6, 5, 4, 3,
    ]);
  });
});

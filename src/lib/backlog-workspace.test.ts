import { describe, expect, it } from "vitest";
import { filterAndSortBacklog } from "@/lib/backlog-workspace";
import type { SteamGame } from "@/lib/steam";

const games: SteamGame[] = [
  { appid: 1, name: "Alpha", playtime_forever: 60, img_icon_url: "" },
  { appid: 2, name: "Beta", playtime_forever: 600, img_icon_url: "" },
  { appid: 3, name: "Gamma", playtime_forever: 0, img_icon_url: "" },
];

describe("filterAndSortBacklog", () => {
  it("only includes tracked games and combines filters", () => {
    const result = filterAndSortBacklog(
      games,
      { "1": "playing", "2": "completed" },
      { "1": "high", "2": "low" },
      {},
      {},
      {
        search: "alp",
        status: "playing",
        priority: "high",
        sort: "name",
      }
    );

    expect(result.map((game) => game.appid)).toEqual([1]);
  });

  it("sorts by rating and leaves unrated games last", () => {
    const result = filterAndSortBacklog(
      games,
      { "1": "playing", "2": "completed", "3": "paused" },
      {},
      { "1": 3, "3": 5 },
      {},
      { search: "", status: "tracked", priority: "all", sort: "rating" }
    );

    expect(result.map((game) => game.appid)).toEqual([3, 1, 2]);
  });

  it("sorts by the most recent status change", () => {
    const result = filterAndSortBacklog(
      games,
      { "1": "playing", "2": "completed" },
      {},
      {},
      {
        "1": "2026-01-01T00:00:00.000Z",
        "2": "2026-02-01T00:00:00.000Z",
      },
      { search: "", status: "tracked", priority: "all", sort: "updated" }
    );

    expect(result.map((game) => game.appid)).toEqual([2, 1]);
  });
});

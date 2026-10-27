import { describe, expect, it } from "vitest";
import {
  createLibrarySearchIndex,
  createNormalizedNameIndex,
  filterAndSortGames,
  getStoreLabels,
} from "@/lib/library";
import { SteamGame } from "@/lib/steam";

const games: SteamGame[] = [
  {
    appid: 1,
    name: "Alpha",
    playtime_forever: 0,
    img_icon_url: "",
  },
  {
    appid: 2,
    name: "Beta",
    playtime_forever: 60,
    playtime_2weeks: 20,
    img_icon_url: "",
  },
  {
    appid: 3,
    name: "Gamma",
    playtime_forever: 600,
    playtime_2weeks: 90,
    img_icon_url: "",
  },
];

describe("filterAndSortGames", () => {
  it("combines search, playtime, and backlog filters", () => {
    const result = filterAndSortGames(
      games,
      { "2": "wantToPlay", "3": "completed" },
      {
        search: "beta",
        playtimeFilter: "under2",
        statusFilter: "wantToPlay",
        sort: "nameAsc",
      }
    );

    expect(result.map((game) => game.appid)).toEqual([2]);
  });

  it("sorts recent activity without mutating the source", () => {
    const result = filterAndSortGames(games, {}, {
      search: "",
      playtimeFilter: "all",
      statusFilter: "all",
      sort: "recent",
    });

    expect(result.map((game) => game.appid)).toEqual([3, 2, 1]);
    expect(games.map((game) => game.appid)).toEqual([1, 2, 3]);
  });

  it("finds games that have not been assigned a status", () => {
    const result = filterAndSortGames(
      games,
      { "1": "playing", "3": "completed" },
      {
        search: "",
        playtimeFilter: "all",
        statusFilter: "untracked",
        sort: "playtimeDesc",
      }
    );

    expect(result.map((game) => game.appid)).toEqual([2]);
  });

  it("reuses normalized names and handles equivalent Unicode searches", () => {
    const accentedGames = [
      { ...games[0], name: "Pok\u00e9mon" },
    ];
    const normalizedNames = createNormalizedNameIndex(accentedGames);
    const result = filterAndSortGames(
      accentedGames,
      {},
      {
        search: "Poke\u0301mon",
        playtimeFilter: "all",
        statusFilter: "all",
        sort: "nameAsc",
      },
      normalizedNames
    );

    expect(result).toEqual(accentedGames);
    expect(normalizedNames.get(1)).toBe("poke\u0301mon");
  });

  it("indexes game names together with Steam genres and tags", () => {
    const index = createLibrarySearchIndex(
      games,
      new Map([[1, {
        appid: 1,
        name: "Alpha",
        type: "game",
        genres: [{ id: "3", description: "RPG" }],
        tags: ["Survival"],
      }]])
    );

    expect(index.get(1)).toContain("alpha");
    expect(index.get(1)).toContain("rpg");
    expect(index.get(1)).toContain("survival");
  });

  it("uses unique genres and tags returned by Steam Store metadata", () => {
    const metadata = new Map([
      [1, { appid: 1, name: "Alpha", type: "game", genres: [{ id: "3", description: "RPG" }], tags: ["Survival"] }],
      [2, { appid: 2, name: "Beta", type: "game", genres: [{ id: "1", description: "Action" }, { id: "3", description: "RPG" }] }],
    ]);

    expect(getStoreLabels(metadata)).toEqual(["Action", "RPG", "Survival"]);
  });
});

import { describe, expect, it } from "vitest";
import { filterAndSortGames } from "@/lib/library";
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
});

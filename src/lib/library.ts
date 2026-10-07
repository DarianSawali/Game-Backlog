import { BacklogStatus } from "@/lib/backlog";
import { SteamGame } from "@/lib/steam";

export type PlaytimeFilter = "all" | "unplayed" | "under2";
export type StatusFilter = "all" | "untracked" | BacklogStatus;
export type LibrarySort =
  | "playtimeDesc"
  | "playtimeAsc"
  | "recent"
  | "nameAsc";

type LibraryOptions = {
  search: string;
  playtimeFilter: PlaytimeFilter;
  statusFilter: StatusFilter;
  sort: LibrarySort;
};

export function filterAndSortGames(
  games: SteamGame[],
  statuses: Record<string, BacklogStatus>,
  options: LibraryOptions
) {
  const normalizedSearch = options.search.trim().toLocaleLowerCase();

  return games
    .filter((game) => {
      if (
        normalizedSearch &&
        !game.name.toLocaleLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (
        options.playtimeFilter === "unplayed" &&
        game.playtime_forever !== 0
      ) {
        return false;
      }

      if (
        options.playtimeFilter === "under2" &&
        (game.playtime_forever === 0 || game.playtime_forever >= 120)
      ) {
        return false;
      }

      const status = statuses[String(game.appid)];

      if (options.statusFilter === "untracked") {
        return !status;
      }

      return (
        options.statusFilter === "all" ||
        status === options.statusFilter
      );
    })
    .sort((a, b) => {
      switch (options.sort) {
        case "playtimeAsc":
          return a.playtime_forever - b.playtime_forever;
        case "recent":
          return (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0);
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "playtimeDesc":
        default:
          return b.playtime_forever - a.playtime_forever;
      }
    });
}

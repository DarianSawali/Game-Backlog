import type {
  BacklogPriority,
  BacklogRating,
  BacklogStatus,
} from "@/lib/backlog";
import type { SteamGame } from "@/lib/steam";

export type BacklogStatusFilter = "tracked" | BacklogStatus;
export type BacklogPriorityFilter =
  | "all"
  | "unassigned"
  | BacklogPriority;
export type BacklogSort =
  | "priority"
  | "updated"
  | "rating"
  | "name"
  | "playtime";

export type BacklogWorkspaceOptions = {
  search: string;
  status: BacklogStatusFilter;
  priority: BacklogPriorityFilter;
  sort: BacklogSort;
};

const priorityWeight: Record<BacklogPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function filterAndSortBacklog(
  games: SteamGame[],
  statuses: Record<string, BacklogStatus>,
  priorities: Record<string, BacklogPriority>,
  ratings: Record<string, BacklogRating>,
  statusDates: Record<string, string>,
  options: BacklogWorkspaceOptions
) {
  const search = options.search.trim().toLocaleLowerCase();

  return games
    .filter((game) => {
      const key = String(game.appid);
      const status = statuses[key];
      const priority = priorities[key];

      if (!status || (options.status !== "tracked" && status !== options.status)) {
        return false;
      }

      if (search && !game.name.toLocaleLowerCase().includes(search)) {
        return false;
      }

      if (options.priority === "unassigned") {
        return !priority;
      }

      return options.priority === "all" || priority === options.priority;
    })
    .sort((a, b) => {
      const aKey = String(a.appid);
      const bKey = String(b.appid);

      switch (options.sort) {
        case "updated":
          return (
            Date.parse(statusDates[bKey] ?? "") -
            Date.parse(statusDates[aKey] ?? "") ||
            a.name.localeCompare(b.name)
          );
        case "rating":
          return (
            (ratings[bKey] ?? 0) - (ratings[aKey] ?? 0) ||
            a.name.localeCompare(b.name)
          );
        case "name":
          return a.name.localeCompare(b.name);
        case "playtime":
          return b.playtime_forever - a.playtime_forever;
        case "priority":
        default:
          return (
            (priorities[bKey] ? priorityWeight[priorities[bKey]] : 0) -
              (priorities[aKey] ? priorityWeight[priorities[aKey]] : 0) ||
            a.name.localeCompare(b.name)
          );
      }
    });
}

"use client";

import { useMemo, useState } from "react";
import GameCard from "@/components/GameCard";
import {
  BACKLOG_STATUS_OPTIONS,
  BacklogStatus,
  useBacklogStatuses,
} from "@/lib/backlog";
import { SteamGame } from "@/lib/steam";

type Props = {
  games: SteamGame[];
};

type PlaytimeFilter = "all" | "unplayed" | "under2";
type StatusFilter = "all" | "untracked" | BacklogStatus;
type SortOption =
  | "playtimeDesc"
  | "playtimeAsc"
  | "recent"
  | "nameAsc";

const PAGE_SIZE = 24;

export default function GameLibrary({ games }: Props) {
  const [search, setSearch] = useState("");
  const [playtimeFilter, setPlaytimeFilter] =
    useState<PlaytimeFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("playtimeDesc");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { statuses } = useBacklogStatuses();

  const filteredGames = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();

    return games
      .filter((game) => {
        if (
          normalizedSearch &&
          !game.name.toLocaleLowerCase().includes(normalizedSearch)
        ) {
          return false;
        }

        if (
          playtimeFilter === "unplayed" &&
          game.playtime_forever !== 0
        ) {
          return false;
        }

        if (
          playtimeFilter === "under2" &&
          (game.playtime_forever === 0 ||
            game.playtime_forever >= 120)
        ) {
          return false;
        }

        const status = statuses[String(game.appid)];

        if (statusFilter === "untracked") {
          return !status;
        }

        if (statusFilter !== "all" && status !== statusFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sort) {
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
  }, [games, playtimeFilter, search, sort, statusFilter, statuses]);

  const visibleGames = filteredGames.slice(0, visibleCount);
  const unplayedCount = games.filter(
    (game) => game.playtime_forever === 0
  ).length;
  const underTwoHoursCount = games.filter(
    (game) =>
      game.playtime_forever > 0 && game.playtime_forever < 120
  ).length;

  function resetVisibleCount() {
    setVisibleCount(PAGE_SIZE);
  }

  function clearFilters() {
    setSearch("");
    setPlaytimeFilter("all");
    setStatusFilter("all");
    setSort("playtimeDesc");
    resetVisibleCount();
  }

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Your Library</h2>
          <p className="mt-1 text-sm text-gray-500">
            Search, organize, and work through your Steam games.
          </p>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          Clear filters
        </button>
      </div>

      <div className="mt-6 grid gap-4 rounded-xl border p-4 md:grid-cols-2 xl:grid-cols-4">
        <label>
          <span className="mb-1 block text-sm font-medium">Search</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetVisibleCount();
            }}
            placeholder="Search your library"
            className="w-full rounded-lg border bg-transparent px-3 py-2"
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium">Playtime</span>
          <select
            value={playtimeFilter}
            onChange={(event) => {
              setPlaytimeFilter(event.target.value as PlaytimeFilter);
              resetVisibleCount();
            }}
            className="w-full rounded-lg border bg-transparent px-3 py-2"
          >
            <option value="all">All games ({games.length})</option>
            <option value="unplayed">Unplayed ({unplayedCount})</option>
            <option value="under2">
              Under 2 hours ({underTwoHoursCount})
            </option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium">
            Backlog status
          </span>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              resetVisibleCount();
            }}
            className="w-full rounded-lg border bg-transparent px-3 py-2"
          >
            <option value="all">All statuses</option>
            <option value="untracked">Not tracked</option>
            {BACKLOG_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-sm font-medium">Sort by</span>
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as SortOption);
              resetVisibleCount();
            }}
            className="w-full rounded-lg border bg-transparent px-3 py-2"
          >
            <option value="playtimeDesc">Most played</option>
            <option value="playtimeAsc">Least played</option>
            <option value="recent">Recently played</option>
            <option value="nameAsc">Name A–Z</option>
          </select>
        </label>
      </div>

      <p className="my-4 text-sm text-gray-500" aria-live="polite">
        Showing {Math.min(visibleCount, filteredGames.length)} of{" "}
        {filteredGames.length} matching games
      </p>

      {visibleGames.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleGames.map((game) => (
            <GameCard key={game.appid} game={game} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">
          No games match these filters.
        </div>
      )}

      {visibleCount < filteredGames.length && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((count) => count + PAGE_SIZE)
            }
            className="rounded-lg border px-5 py-2"
          >
            Load {Math.min(
              PAGE_SIZE,
              filteredGames.length - visibleCount
            )} more
          </button>
        </div>
      )}
    </section>
  );
}

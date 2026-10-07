"use client";

import { useMemo, useState } from "react";
import BacklogGameEditor from "@/components/BacklogGameEditor";
import {
  BACKLOG_PRIORITY_OPTIONS,
  BACKLOG_STATUS_OPTIONS,
  useBacklogPriorities,
  useBacklogRatings,
  useBacklogStatusDates,
  useBacklogStatuses,
} from "@/lib/backlog";
import {
  BacklogPriorityFilter,
  BacklogSort,
  BacklogStatusFilter,
  filterAndSortBacklog,
} from "@/lib/backlog-workspace";
import type { SteamGame } from "@/lib/steam";

type Props = {
  games: SteamGame[];
};

const PAGE_SIZE = 20;

export default function BacklogWorkspace({ games }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<BacklogStatusFilter>("tracked");
  const [priorityFilter, setPriorityFilter] =
    useState<BacklogPriorityFilter>("all");
  const [sort, setSort] = useState<BacklogSort>("priority");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const { statuses } = useBacklogStatuses();
  const { priorities } = useBacklogPriorities();
  const { ratings } = useBacklogRatings();
  const { statusDates } = useBacklogStatusDates();

  const filteredGames = useMemo(
    () =>
      filterAndSortBacklog(
        games,
        statuses,
        priorities,
        ratings,
        statusDates,
        {
          search,
          status: statusFilter,
          priority: priorityFilter,
          sort,
        }
      ),
    [
      games,
      priorities,
      priorityFilter,
      ratings,
      search,
      sort,
      statusDates,
      statuses,
      statusFilter,
    ]
  );
  const trackedCount = games.filter(
    (game) => statuses[String(game.appid)]
  ).length;
  const completedCount = games.filter(
    (game) => statuses[String(game.appid)] === "completed"
  ).length;
  const highPriorityCount = games.filter((game) => {
    const key = String(game.appid);
    return statuses[key] && priorities[key] === "high";
  }).length;

  function resetVisibleCount() {
    setVisibleCount(PAGE_SIZE);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("tracked");
    setPriorityFilter("all");
    setSort("priority");
    resetVisibleCount();
  }

  return (
    <>
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">Tracked games</p>
          <p className="mt-1 text-3xl font-bold">{trackedCount}</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">Completion rate</p>
          <p className="mt-1 text-3xl font-bold">
            {trackedCount
              ? Math.round((completedCount / trackedCount) * 100)
              : 0}
            %
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-sm text-gray-500">High-priority games</p>
          <p className="mt-1 text-3xl font-bold">{highPriorityCount}</p>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Your backlog</h2>
            <p className="mt-1 text-sm text-gray-500">
              Filter your tracked games and record what you thought.
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
              placeholder="Search your backlog"
              className="w-full rounded-lg border bg-transparent px-3 py-2"
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as BacklogStatusFilter);
                resetVisibleCount();
              }}
              className="w-full rounded-lg border bg-transparent px-3 py-2"
            >
              <option value="tracked">All tracked games</option>
              {BACKLOG_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">Priority</span>
            <select
              value={priorityFilter}
              onChange={(event) => {
                setPriorityFilter(event.target.value as BacklogPriorityFilter);
                resetVisibleCount();
              }}
              className="w-full rounded-lg border bg-transparent px-3 py-2"
            >
              <option value="all">All priorities</option>
              <option value="unassigned">No priority</option>
              {BACKLOG_PRIORITY_OPTIONS.map((option) => (
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
                setSort(event.target.value as BacklogSort);
                resetVisibleCount();
              }}
              className="w-full rounded-lg border bg-transparent px-3 py-2"
            >
              <option value="priority">Priority</option>
              <option value="updated">Recently updated</option>
              <option value="rating">Highest rated</option>
              <option value="name">Name A-Z</option>
              <option value="playtime">Most played</option>
            </select>
          </label>
        </div>

        <p className="my-4 text-sm text-gray-500" aria-live="polite">
          Showing {Math.min(visibleCount, filteredGames.length)} of{" "}
          {filteredGames.length} matching games
        </p>

        {filteredGames.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredGames.slice(0, visibleCount).map((game) => (
              <BacklogGameEditor key={game.appid} game={game} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <h2 className="font-semibold">No backlog games found</h2>
            <p className="mt-2 text-sm text-gray-500">
              Assign a status from the dashboard or adjust these filters.
            </p>
          </div>
        )}

        {visibleCount < filteredGames.length && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              className="rounded-lg border px-5 py-2"
            >
              Load more
            </button>
          </div>
        )}
      </section>
    </>
  );
}

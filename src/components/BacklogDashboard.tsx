"use client";

import { useMemo, useState } from "react";
import GameCard from "@/components/GameCard";
import {
  BACKLOG_STATUS_OPTIONS,
  BacklogPriority,
  BacklogStatus,
  useBacklogPriorities,
  useBacklogStatuses,
} from "@/lib/backlog";
import { SteamGame } from "@/lib/steam";

type Props = {
  games: SteamGame[];
};

const priorityWeight: Record<BacklogPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export default function BacklogDashboard({ games }: Props) {
  const [selectedStatus, setSelectedStatus] =
    useState<BacklogStatus>("playing");
  const { statuses } = useBacklogStatuses();
  const { priorities } = useBacklogPriorities();
  const counts = useMemo(
    () =>
      Object.fromEntries(
        BACKLOG_STATUS_OPTIONS.map((option) => [
          option.value,
          games.filter(
            (game) => statuses[String(game.appid)] === option.value
          ).length,
        ])
      ) as Record<BacklogStatus, number>,
    [games, statuses]
  );
  const selectedGames = useMemo(
    () =>
      games
        .filter(
          (game) => statuses[String(game.appid)] === selectedStatus
        )
        .sort((a, b) => {
          const aPriority = priorities[String(a.appid)];
          const bPriority = priorities[String(b.appid)];
          const priorityDifference =
            (bPriority ? priorityWeight[bPriority] : 0) -
            (aPriority ? priorityWeight[aPriority] : 0);

          return (
            priorityDifference ||
            (b.playtime_2weeks ?? 0) - (a.playtime_2weeks ?? 0) ||
            b.playtime_forever - a.playtime_forever
          );
        }),
    [games, priorities, selectedStatus, statuses]
  );
  const trackedCount = Object.values(counts).reduce(
    (total, count) => total + count,
    0
  );
  const completionRate = trackedCount
    ? Math.round((counts.completed / trackedCount) * 100)
    : 0;
  const selectedLabel = BACKLOG_STATUS_OPTIONS.find(
    (option) => option.value === selectedStatus
  )?.label;

  return (
    <section className="mt-8 rounded-xl border p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Backlog Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">
            {trackedCount > 0
              ? `${trackedCount} tracked games - ${completionRate}% completed`
              : "Assign statuses to games to build your backlog."}
          </p>
        </div>

        {trackedCount > 0 && (
          <div className="text-right">
            <p className="text-3xl font-bold">{completionRate}%</p>
            <p className="text-xs text-gray-500">completion rate</p>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {BACKLOG_STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setSelectedStatus(option.value)}
            className={`rounded-lg border p-3 text-left transition-colors ${
              selectedStatus === option.value
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-black"
                : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
            }`}
          >
            <span className="block text-2xl font-semibold">
              {counts[option.value]}
            </span>
            <span className="text-sm">{option.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold">{selectedLabel}</h3>

        {selectedGames.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {selectedGames.slice(0, 8).map((game) => (
              <GameCard key={game.appid} game={game} />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-gray-500">
            No games are marked as {selectedLabel?.toLocaleLowerCase()}.
          </div>
        )}

        {selectedGames.length > 8 && (
          <p className="mt-4 text-sm text-gray-500">
            Showing the 8 highest-priority games in this status.
          </p>
        )}
      </div>
    </section>
  );
}

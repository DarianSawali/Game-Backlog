"use client";

import {
  BACKLOG_PRIORITY_OPTIONS,
  BacklogPriority,
  useUserGameData,
} from "@/lib/backlog";

type Props = {
  appid: number;
};

export default function BacklogPrioritySelect({ appid }: Props) {
  const { getGameData, updateGameData } = useUserGameData();
  const priority = getGameData(appid).priority;

  return (
    <label className="block">
      <span className="sr-only">Backlog priority</span>
      <select
        value={priority ?? ""}
        onChange={(event) =>
          updateGameData(appid, {
            priority: (event.target.value || null) as BacklogPriority | null,
          })
        }
        className="w-full rounded-md border px-2 py-1.5 text-sm"
        aria-label="Backlog priority"
      >
        <option value="">No priority</option>
        {BACKLOG_PRIORITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

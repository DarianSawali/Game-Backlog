"use client";

import {
  BACKLOG_STATUS_OPTIONS,
  BacklogStatus,
  useUserGameData,
} from "@/lib/backlog";

type Props = {
  appid: number;
  className?: string;
};

export default function BacklogStatusSelect({
  appid,
  className = "",
}: Props) {
  const { getGameData, updateGameData } = useUserGameData();
  const status = getGameData(appid).status;

  return (
    <label className={`block ${className}`}>
      <span className="sr-only">Backlog status</span>
      <select
        value={status ?? ""}
        onChange={(event) =>
          updateGameData(appid, {
            status: (event.target.value || null) as BacklogStatus | null,
          })
        }
        className="w-full rounded-md border bg-transparent px-2 py-1.5 text-sm"
        aria-label="Backlog status"
      >
        <option value="">Not tracked</option>
        {BACKLOG_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

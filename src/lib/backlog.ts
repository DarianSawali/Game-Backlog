"use client";

import { useSyncExternalStore } from "react";

export type BacklogStatus =
  | "wantToPlay"
  | "playing"
  | "completed"
  | "paused"
  | "dropped";

export const BACKLOG_STATUS_OPTIONS: {
  value: BacklogStatus;
  label: string;
}[] = [
  { value: "wantToPlay", label: "Want to play" },
  { value: "playing", label: "Playing" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
  { value: "dropped", label: "Dropped" },
];

type BacklogStatuses = Record<string, BacklogStatus>;

const STORAGE_KEY = "game-backlog:statuses:v1";
const CHANGE_EVENT = "game-backlog-status-change";
const EMPTY_STATUSES: BacklogStatuses = {};

let cachedRaw: string | null | undefined;
let cachedStatuses: BacklogStatuses = EMPTY_STATUSES;

function isBacklogStatus(value: unknown): value is BacklogStatus {
  return BACKLOG_STATUS_OPTIONS.some(
    (option) => option.value === value
  );
}

function parseStatuses(raw: string | null): BacklogStatuses {
  if (!raw) {
    return EMPTY_STATUSES;
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, BacklogStatus] =>
        isBacklogStatus(entry[1])
      )
    );
  } catch {
    return EMPTY_STATUSES;
  }
}

function getSnapshot() {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedStatuses = parseStatuses(raw);
  }

  return cachedStatuses;
}

function getServerSnapshot() {
  return EMPTY_STATUSES;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

export function useBacklogStatuses() {
  const statuses = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  function setStatus(appid: number, status: BacklogStatus | null) {
    const nextStatuses = { ...getSnapshot() };
    const key = String(appid);

    if (status) {
      nextStatuses[key] = status;
    } else {
      delete nextStatuses[key];
    }

    const raw = JSON.stringify(nextStatuses);
    window.localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedStatuses = nextStatuses;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return {
    statuses,
    getStatus: (appid: number) => statuses[String(appid)] ?? null,
    setStatus,
  };
}

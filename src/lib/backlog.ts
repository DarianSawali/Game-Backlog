"use client";

import { useSyncExternalStore } from "react";

export type BacklogStatus =
  | "wantToPlay"
  | "playing"
  | "completed"
  | "paused"
  | "dropped";

export type BacklogPriority = "low" | "medium" | "high";

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

export const BACKLOG_PRIORITY_OPTIONS: {
  value: BacklogPriority;
  label: string;
}[] = [
  { value: "high", label: "High priority" },
  { value: "medium", label: "Medium priority" },
  { value: "low", label: "Low priority" },
];

type StoredRecord<T extends string> = Record<string, T>;

function createStoredRecord<T extends string>(
  storageKey: string,
  eventName: string,
  validValues: readonly T[]
) {
  const emptyRecord: StoredRecord<T> = {};
  let cachedRaw: string | null | undefined;
  let cachedRecord: StoredRecord<T> = emptyRecord;

  function parseRecord(raw: string | null): StoredRecord<T> {
    if (!raw) {
      return emptyRecord;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      return Object.fromEntries(
        Object.entries(parsed).filter(
          (entry): entry is [string, T] =>
            validValues.includes(entry[1] as T)
        )
      );
    } catch {
      return emptyRecord;
    }
  }

  function getSnapshot() {
    const raw = window.localStorage.getItem(storageKey);

    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedRecord = parseRecord(raw);
    }

    return cachedRecord;
  }

  function subscribe(callback: () => void) {
    window.addEventListener("storage", callback);
    window.addEventListener(eventName, callback);

    return () => {
      window.removeEventListener("storage", callback);
      window.removeEventListener(eventName, callback);
    };
  }

  function setValue(appid: number, value: T | null) {
    const nextRecord = { ...getSnapshot() };
    const key = String(appid);

    if (value) {
      nextRecord[key] = value;
    } else {
      delete nextRecord[key];
    }

    const raw = JSON.stringify(nextRecord);
    window.localStorage.setItem(storageKey, raw);
    cachedRaw = raw;
    cachedRecord = nextRecord;
    window.dispatchEvent(new Event(eventName));
  }

  return {
    getSnapshot,
    getServerSnapshot: () => emptyRecord,
    subscribe,
    setValue,
  };
}

const statusStore = createStoredRecord<BacklogStatus>(
  "game-backlog:statuses:v1",
  "game-backlog-status-change",
  BACKLOG_STATUS_OPTIONS.map((option) => option.value)
);
const priorityStore = createStoredRecord<BacklogPriority>(
  "game-backlog:priorities:v1",
  "game-backlog-priority-change",
  BACKLOG_PRIORITY_OPTIONS.map((option) => option.value)
);

export function useBacklogStatuses() {
  const statuses = useSyncExternalStore(
    statusStore.subscribe,
    statusStore.getSnapshot,
    statusStore.getServerSnapshot
  );

  return {
    statuses,
    getStatus: (appid: number) => statuses[String(appid)] ?? null,
    setStatus: statusStore.setValue,
  };
}

export function useBacklogPriorities() {
  const priorities = useSyncExternalStore(
    priorityStore.subscribe,
    priorityStore.getSnapshot,
    priorityStore.getServerSnapshot
  );

  return {
    priorities,
    getPriority: (appid: number) => priorities[String(appid)] ?? null,
    setPriority: priorityStore.setValue,
  };
}

"use client";

import { useSyncExternalStore } from "react";
import {
  parseStoredRecord,
  updateStoredRecord,
} from "@/lib/backlog-storage";

export type BacklogStatus =
  | "wantToPlay"
  | "playing"
  | "completed"
  | "paused"
  | "dropped";

export type BacklogPriority = "low" | "medium" | "high";
export type BacklogRating = 1 | 2 | 3 | 4 | 5;

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

type StoredRecord<T> = Record<string, T>;

function createStoredRecord<T>(
  storageKey: string,
  eventName: string,
  isValidValue: (value: unknown) => value is T
) {
  const emptyRecord: StoredRecord<T> = {};
  let cachedRaw: string | null | undefined;
  let cachedRecord: StoredRecord<T> = emptyRecord;

  function parseRecord(raw: string | null): StoredRecord<T> {
    const parsed = parseStoredRecord(raw, isValidValue);
    return Object.keys(parsed).length > 0 ? parsed : emptyRecord;
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
    const nextRecord = updateStoredRecord(getSnapshot(), appid, value);

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
  (value): value is BacklogStatus =>
    BACKLOG_STATUS_OPTIONS.some((option) => option.value === value)
);
const priorityStore = createStoredRecord<BacklogPriority>(
  "game-backlog:priorities:v1",
  "game-backlog-priority-change",
  (value): value is BacklogPriority =>
    BACKLOG_PRIORITY_OPTIONS.some((option) => option.value === value)
);
const noteStore = createStoredRecord<string>(
  "game-backlog:notes:v1",
  "game-backlog-note-change",
  (value): value is string => typeof value === "string"
);
const ratingStore = createStoredRecord<BacklogRating>(
  "game-backlog:ratings:v1",
  "game-backlog-rating-change",
  (value): value is BacklogRating =>
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 5
);
const statusDateStore = createStoredRecord<string>(
  "game-backlog:status-dates:v1",
  "game-backlog-status-date-change",
  (value): value is string =>
    typeof value === "string" && !Number.isNaN(Date.parse(value))
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
    setStatus: (appid: number, status: BacklogStatus | null) => {
      statusStore.setValue(appid, status);
      statusDateStore.setValue(
        appid,
        status ? new Date().toISOString() : null
      );
    },
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

export function useBacklogNotes() {
  const notes = useSyncExternalStore(
    noteStore.subscribe,
    noteStore.getSnapshot,
    noteStore.getServerSnapshot
  );

  return {
    notes,
    getNote: (appid: number) => notes[String(appid)] ?? "",
    setNote: (appid: number, note: string | null) =>
      noteStore.setValue(appid, note?.trim() ? note.trim() : null),
  };
}

export function useBacklogRatings() {
  const ratings = useSyncExternalStore(
    ratingStore.subscribe,
    ratingStore.getSnapshot,
    ratingStore.getServerSnapshot
  );

  return {
    ratings,
    getRating: (appid: number) => ratings[String(appid)] ?? null,
    setRating: ratingStore.setValue,
  };
}

export function useBacklogStatusDates() {
  const statusDates = useSyncExternalStore(
    statusDateStore.subscribe,
    statusDateStore.getSnapshot,
    statusDateStore.getServerSnapshot
  );

  return {
    statusDates,
    getStatusDate: (appid: number) => statusDates[String(appid)] ?? null,
  };
}

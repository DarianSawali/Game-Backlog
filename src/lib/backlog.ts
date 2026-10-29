"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  parseStoredStringArray,
  parseStoredRecord,
  toggleStoredStringValue,
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

export type UserGameData = {
  appId: number;
  status: BacklogStatus | null;
  priority: BacklogPriority | null;
  rating: BacklogRating | null;
  notes: string;
  hidden: boolean;
  rejectedAt: string | null;
  statusChangedAt: string | null;
};

export type UserGameDataUpdate = Partial<
  Omit<UserGameData, "appId" | "statusChangedAt">
>;

export function createUserGameIndexes(
  userGames: Record<string, UserGameData>
) {
  const statuses: Record<string, BacklogStatus> = {};
  const priorities: Record<string, BacklogPriority> = {};
  const ratings: Record<string, BacklogRating> = {};
  const statusDates: Record<string, string> = {};
  const hiddenGameIds = new Set<number>();

  for (const [key, data] of Object.entries(userGames)) {
    if (data.status) statuses[key] = data.status;
    if (data.priority) priorities[key] = data.priority;
    if (data.rating) ratings[key] = data.rating;
    if (data.statusChangedAt) statusDates[key] = data.statusChangedAt;
    if (data.hidden) hiddenGameIds.add(data.appId);
  }

  const rejectedGameIds = new Set(
    Object.values(userGames)
      .filter((data) => data.rejectedAt)
      .sort((left, right) =>
        Date.parse(right.rejectedAt ?? "") - Date.parse(left.rejectedAt ?? "")
      )
      .slice(0, 5)
      .map((data) => data.appId)
  );

  return {
    statuses,
    priorities,
    ratings,
    statusDates,
    hiddenGameIds,
    rejectedGameIds,
  };
}

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
const hiddenGameStore = createStoredRecord<boolean>(
  "game-backlog:hidden-games:v1",
  "game-backlog-hidden-games-change",
  (value): value is boolean => value === true
);
const rejectedAtStore = createStoredRecord<string>(
  "game-backlog:rejected-at:v1",
  "game-backlog-rejected-at-change",
  (value): value is string =>
    typeof value === "string" && !Number.isNaN(Date.parse(value))
);

const genrePreferenceKey = "game-backlog:genre-preferences:v1";
const genrePreferenceEvent = "game-backlog-genre-preferences-change";
const emptyGenrePreferences: string[] = [];
let cachedGenreRaw: string | null | undefined;
let cachedGenrePreferences = emptyGenrePreferences;

function getGenrePreferencesSnapshot() {
  const raw = window.localStorage.getItem(genrePreferenceKey);
  if (raw !== cachedGenreRaw) {
    cachedGenreRaw = raw;
    const parsed = parseStoredStringArray(raw).filter(
      (genre) => genre.trim().length > 0 && genre.length <= 80
    );
    cachedGenrePreferences = parsed.length ? parsed : emptyGenrePreferences;
  }
  return cachedGenrePreferences;
}

function subscribeToGenrePreferences(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(genrePreferenceEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(genrePreferenceEvent, callback);
  };
}

export function useUserGameData() {
  const statuses = useSyncExternalStore(
    statusStore.subscribe,
    statusStore.getSnapshot,
    statusStore.getServerSnapshot
  );
  const priorities = useSyncExternalStore(
    priorityStore.subscribe,
    priorityStore.getSnapshot,
    priorityStore.getServerSnapshot
  );
  const notes = useSyncExternalStore(
    noteStore.subscribe,
    noteStore.getSnapshot,
    noteStore.getServerSnapshot
  );
  const ratings = useSyncExternalStore(
    ratingStore.subscribe,
    ratingStore.getSnapshot,
    ratingStore.getServerSnapshot
  );
  const statusDates = useSyncExternalStore(
    statusDateStore.subscribe,
    statusDateStore.getSnapshot,
    statusDateStore.getServerSnapshot
  );
  const hiddenGames = useSyncExternalStore(
    hiddenGameStore.subscribe,
    hiddenGameStore.getSnapshot,
    hiddenGameStore.getServerSnapshot
  );
  const rejectedDates = useSyncExternalStore(
    rejectedAtStore.subscribe,
    rejectedAtStore.getSnapshot,
    rejectedAtStore.getServerSnapshot
  );

  const userGames = useMemo(() => {
    const appIds = new Set([
      ...Object.keys(statuses),
      ...Object.keys(priorities),
      ...Object.keys(ratings),
      ...Object.keys(notes),
      ...Object.keys(hiddenGames),
      ...Object.keys(rejectedDates),
      ...Object.keys(statusDates),
    ]);

    return Object.fromEntries([...appIds].map((key) => [key, {
      appId: Number(key),
      status: statuses[key] ?? null,
      priority: priorities[key] ?? null,
      rating: ratings[key] ?? null,
      notes: notes[key] ?? "",
      hidden: hiddenGames[key] === true,
      rejectedAt: rejectedDates[key] ?? null,
      statusChangedAt: statusDates[key] ?? null,
    }])) as Record<string, UserGameData>;
  }, [hiddenGames, notes, priorities, ratings, rejectedDates, statusDates, statuses]);

  const getGameData = useCallback((appId: number): UserGameData =>
    userGames[String(appId)] ?? {
      appId,
      status: null,
      priority: null,
      rating: null,
      notes: "",
      hidden: false,
      rejectedAt: null,
      statusChangedAt: null,
    }, [userGames]);

  const updateGameData = useCallback((appId: number, update: UserGameDataUpdate) => {
    if ("status" in update) {
      statusStore.setValue(appId, update.status ?? null);
      statusDateStore.setValue(
        appId,
        update.status ? new Date().toISOString() : null
      );
    }
    if ("priority" in update) priorityStore.setValue(appId, update.priority ?? null);
    if ("rating" in update) ratingStore.setValue(appId, update.rating ?? null);
    if ("notes" in update) {
      const value = update.notes?.trim() ?? "";
      noteStore.setValue(appId, value || null);
    }
    if ("hidden" in update) hiddenGameStore.setValue(appId, update.hidden ? true : null);
    if ("rejectedAt" in update) rejectedAtStore.setValue(appId, update.rejectedAt ?? null);
  }, []);

  return {
    userGames,
    getGameData,
    updateGameData,
  };
}

export function useGenrePreferences() {
  const preferredGenres = useSyncExternalStore(
    subscribeToGenrePreferences,
    getGenrePreferencesSnapshot,
    () => emptyGenrePreferences
  );

  return {
    preferredGenres,
    toggleGenre: (genre: string) => {
      const normalizedGenre = genre.trim();
      if (!normalizedGenre || normalizedGenre.length > 80) return;
      const next = toggleStoredStringValue(getGenrePreferencesSnapshot(), normalizedGenre);
      const raw = JSON.stringify(next);
      window.localStorage.setItem(genrePreferenceKey, raw);
      cachedGenreRaw = raw;
      cachedGenrePreferences = next.length ? next : emptyGenrePreferences;
      window.dispatchEvent(new Event(genrePreferenceEvent));
    },
  };
}

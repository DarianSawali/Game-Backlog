import type { SteamLibraryResult } from "@/lib/library-sync";

export type UserProfile = {
  id: string;
  steamId: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
};

export type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: UserProfile };

export type LibraryAccessState =
  | { status: "unknown" }
  | { status: "available"; gameCount: number }
  | { status: "private" }
  | { status: "failed"; message: string };

export type SyncState =
  | { status: "idle"; lastSyncedAt: string | null }
  | { status: "syncing"; lastSyncedAt: string | null }
  | {
      status: "success";
      syncedAt: string;
      added: number;
      updated: number;
      markedUnavailable: number;
    }
  | {
      status: "failed";
      message: string;
      lastSyncedAt: string | null;
    };

export type AppState = {
  auth: AuthState;
  library: LibraryAccessState;
  sync: SyncState;
  signOutConfirmationOpen: boolean;
};

export type AppStateAction =
  | { type: "SESSION_LOADING" }
  | { type: "SIGNED_IN"; user: UserProfile }
  | { type: "SIGNED_OUT" }
  | { type: "LIBRARY_UNKNOWN" }
  | { type: "LIBRARY_AVAILABLE"; gameCount: number }
  | { type: "LIBRARY_PRIVATE" }
  | { type: "LIBRARY_FAILED"; message: string }
  | { type: "SYNC_STARTED" }
  | {
      type: "SYNC_SUCCEEDED";
      syncedAt: string;
      added: number;
      updated: number;
      markedUnavailable: number;
    }
  | { type: "SYNC_FAILED"; message: string }
  | { type: "SYNC_RESET" }
  | { type: "SIGN_OUT_REQUESTED" }
  | { type: "SIGN_OUT_CANCELLED" }
  | { type: "SIGN_OUT_CONFIRMED" };

export function createInitialAppState(auth: AuthState): AppState {
  return {
    auth,
    library: { status: "unknown" },
    sync: { status: "idle", lastSyncedAt: null },
    signOutConfirmationOpen: false,
  };
}

export function getLibraryAccessState(
  result: SteamLibraryResult | null
): LibraryAccessState {
  if (!result) {
    return {
      status: "failed",
      message: "Steam could not be reached. Your previous library is unchanged.",
    };
  }

  if (result.status === "available") {
    return { status: "available", gameCount: result.games.length };
  }

  if (result.status === "private") return { status: "private" };

  return {
    status: "failed",
    message: result.reason === "rate-limited"
      ? "Steam is receiving too many requests. Wait briefly and retry."
      : "Steam could not be reached. Your previous library is unchanged.",
  };
}

function getLastSyncedAt(sync: SyncState) {
  if (sync.status === "success") return sync.syncedAt;
  return sync.lastSyncedAt;
}

export function appStateReducer(
  state: AppState,
  action: AppStateAction
): AppState {
  switch (action.type) {
    case "SESSION_LOADING":
      return { ...state, auth: { status: "loading" } };
    case "SIGNED_IN":
      return {
        ...state,
        auth: { status: "authenticated", user: action.user },
        signOutConfirmationOpen: false,
      };
    case "SIGNED_OUT":
    case "SIGN_OUT_CONFIRMED":
      return createInitialAppState({ status: "anonymous" });
    case "LIBRARY_UNKNOWN":
      return { ...state, library: { status: "unknown" } };
    case "LIBRARY_AVAILABLE":
      return {
        ...state,
        library: { status: "available", gameCount: action.gameCount },
      };
    case "LIBRARY_PRIVATE":
      return { ...state, library: { status: "private" } };
    case "LIBRARY_FAILED":
      return {
        ...state,
        library: { status: "failed", message: action.message },
        sync: {
          status: "failed",
          message: action.message,
          lastSyncedAt: getLastSyncedAt(state.sync),
        },
      };
    case "SYNC_STARTED":
      return {
        ...state,
        sync: {
          status: "syncing",
          lastSyncedAt: getLastSyncedAt(state.sync),
        },
      };
    case "SYNC_SUCCEEDED":
      return {
        ...state,
        sync: {
          status: "success",
          syncedAt: action.syncedAt,
          added: action.added,
          updated: action.updated,
          markedUnavailable: action.markedUnavailable,
        },
      };
    case "SYNC_FAILED":
      return {
        ...state,
        sync: {
          status: "failed",
          message: action.message,
          lastSyncedAt: getLastSyncedAt(state.sync),
        },
      };
    case "SYNC_RESET":
      return {
        ...state,
        sync: {
          status: "idle",
          lastSyncedAt: getLastSyncedAt(state.sync),
        },
      };
    case "SIGN_OUT_REQUESTED":
      return { ...state, signOutConfirmationOpen: true };
    case "SIGN_OUT_CANCELLED":
      return { ...state, signOutConfirmationOpen: false };
    default:
      return state;
  }
}

import { describe, expect, it } from "vitest";
import {
  appStateReducer,
  createInitialAppState,
  getLibraryAccessState,
  type UserProfile,
} from "@/lib/auth-state";

const user: UserProfile = {
  id: "development-user",
  steamId: "76561198000000000",
  displayName: "Darian",
  avatarUrl: "avatar.jpg",
  profileUrl: "https://steamcommunity.com/profiles/76561198000000000",
};

describe("appStateReducer", () => {
  it("moves through loading, anonymous, and authenticated states", () => {
    const loading = createInitialAppState({ status: "loading" });
    const anonymous = appStateReducer(loading, { type: "SIGNED_OUT" });
    const authenticated = appStateReducer(anonymous, {
      type: "SIGNED_IN",
      user,
    });

    expect(anonymous.auth).toEqual({ status: "anonymous" });
    expect(authenticated.auth).toEqual({ status: "authenticated", user });
  });

  it("keeps library access independent from synchronization", () => {
    const initial = createInitialAppState({ status: "authenticated", user });
    const available = appStateReducer(initial, {
      type: "LIBRARY_AVAILABLE",
      gameCount: 293,
    });
    const syncing = appStateReducer(available, { type: "SYNC_STARTED" });
    const failed = appStateReducer(syncing, {
      type: "SYNC_FAILED",
      message: "Steam timed out",
    });

    expect(failed.library).toEqual({ status: "available", gameCount: 293 });
    expect(failed.sync).toMatchObject({
      status: "failed",
      message: "Steam timed out",
    });
  });

  it("requires confirmation before clearing authenticated state", () => {
    const initial = createInitialAppState({ status: "authenticated", user });
    const requested = appStateReducer(initial, {
      type: "SIGN_OUT_REQUESTED",
    });
    const cancelled = appStateReducer(requested, {
      type: "SIGN_OUT_CANCELLED",
    });
    const confirmed = appStateReducer(requested, {
      type: "SIGN_OUT_CONFIRMED",
    });

    expect(requested.auth.status).toBe("authenticated");
    expect(requested.signOutConfirmationOpen).toBe(true);
    expect(cancelled.auth.status).toBe("authenticated");
    expect(confirmed.auth).toEqual({ status: "anonymous" });
    expect(confirmed.library).toEqual({ status: "unknown" });
  });

  it("represents private libraries separately from failures", () => {
    const initial = createInitialAppState({ status: "authenticated", user });
    const privateState = appStateReducer(initial, {
      type: "LIBRARY_PRIVATE",
    });
    const failedState = appStateReducer(initial, {
      type: "LIBRARY_FAILED",
      message: "Steam is unavailable",
    });

    expect(privateState.library).toEqual({ status: "private" });
    expect(failedState.library).toEqual({
      status: "failed",
      message: "Steam is unavailable",
    });
  });
});

describe("getLibraryAccessState", () => {
  it("maps Steam results to distinct UI states", () => {
    expect(getLibraryAccessState({
      status: "available",
      games: [{
        appid: 1,
        name: "Game",
        playtime_forever: 0,
        img_icon_url: "",
      }],
    })).toEqual({ status: "available", gameCount: 1 });
    expect(getLibraryAccessState({ status: "private" })).toEqual({
      status: "private",
    });
    expect(getLibraryAccessState({
      status: "failed",
      reason: "rate-limited",
      message: "429",
    })).toMatchObject({ status: "failed" });
  });
});

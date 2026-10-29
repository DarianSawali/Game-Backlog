import "server-only";

import type { AuthState, UserProfile } from "@/lib/auth-state";
import { getPlayerProfile } from "@/lib/steam";

export type DevelopmentAuth = {
  initialAuthState: AuthState;
  developmentUser: UserProfile | null;
  developmentControlsEnabled: boolean;
};

export async function getDevelopmentAuth(): Promise<DevelopmentAuth> {
  if (process.env.NODE_ENV === "production") {
    return {
      initialAuthState: { status: "anonymous" },
      developmentUser: null,
      developmentControlsEnabled: false,
    };
  }

  const steamId = process.env.STEAM_ID?.trim();

  if (!steamId || !/^\d{17}$/.test(steamId)) {
    return {
      initialAuthState: { status: "anonymous" },
      developmentUser: null,
      developmentControlsEnabled: true,
    };
  }

  let user: UserProfile;

  try {
    const profile = await getPlayerProfile(steamId);
    user = profile ? {
      id: `development:${steamId}`,
      ...profile,
    } : {
      id: `development:${steamId}`,
      steamId,
      displayName: "Development Player",
      avatarUrl: "",
      profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
    };
  } catch {
    user = {
      id: `development:${steamId}`,
      steamId,
      displayName: "Development Player",
      avatarUrl: "",
      profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
    };
  }

  return {
    initialAuthState: { status: "authenticated", user },
    developmentUser: user,
    developmentControlsEnabled: true,
  };
}

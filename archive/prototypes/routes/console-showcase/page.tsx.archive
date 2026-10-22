import type { Metadata } from "next";
import ConsoleShowcase from "@/components/ConsoleShowcase";
import { getFriendGameActivity } from "@/lib/friends";
import {
  getFriendList,
  getOwnedGames,
  getRecentlyPlayedGames,
} from "@/lib/steam";

export const metadata: Metadata = {
  title: "Console Showcase | Game Backlog",
  description: "A console-inspired view of your real Steam library and backlog.",
};

export default async function ConsoleShowcasePage() {
  const [gamesResult, recentResult, friendsResult] = await Promise.allSettled([
    getOwnedGames(),
    getRecentlyPlayedGames(),
    getFriendList(),
  ]);
  const games = gamesResult.status === "fulfilled" ? gamesResult.value : [];
  const recentGames = recentResult.status === "fulfilled" ? recentResult.value : [];
  const friends = friendsResult.status === "fulfilled" ? friendsResult.value : [];
  const warnings: string[] = [];

  if (gamesResult.status === "rejected") warnings.push("Steam library unavailable");
  if (recentResult.status === "rejected") warnings.push("Recent activity unavailable");
  if (friendsResult.status === "rejected") warnings.push("Friend list unavailable");

  let friendActivity: Awaited<ReturnType<typeof getFriendGameActivity>> = [];

  try {
    friendActivity = await getFriendGameActivity(friends);
  } catch {
    warnings.push("Friend activity unavailable");
  }

  return (
    <ConsoleShowcase
      games={games}
      recentGames={recentGames}
      friendActivity={friendActivity}
      warnings={warnings}
    />
  );
}

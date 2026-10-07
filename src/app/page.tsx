import {
  getOwnedGames,
  getRecentlyPlayedGames,
  getFriendList,
} from "@/lib/steam";
import GameLibrary from "@/components/GameLibrary";
import GameSuggestion from "@/components/GameSuggestion";
import RecentlyPlayed from "@/components/RecentlyPlayed";

import { getFriendGameActivity } from "@/lib/friends";
import FriendActivity from "@/components/FriendActivity";
import BacklogDashboard from "@/components/BacklogDashboard";
import Link from "next/link";


export default async function Home() {
  const [gamesResult, recentGamesResult, friendsResult] =
    await Promise.allSettled([
      getOwnedGames(),
      getRecentlyPlayedGames(),
      getFriendList(),
    ]);

  const games =
    gamesResult.status === "fulfilled" ? gamesResult.value : [];
  const recentGames =
    recentGamesResult.status === "fulfilled"
      ? recentGamesResult.value
      : [];
  const friends =
    friendsResult.status === "fulfilled" ? friendsResult.value : [];
  const warnings: string[] = [
    gamesResult.status === "rejected"
      ? "Your Steam library could not be loaded."
      : null,
    recentGamesResult.status === "rejected"
      ? "Recent play activity is temporarily unavailable."
      : null,
    friendsResult.status === "rejected"
      ? "Your Steam friends list is unavailable or private."
      : null,
  ].filter((warning): warning is string => warning !== null);

  const sortedGames = [...games].sort(
    (a, b) =>
      b.playtime_forever - a.playtime_forever
  );

  let friendActivity: Awaited<
    ReturnType<typeof getFriendGameActivity>
  > = [];

  try {
    friendActivity = await getFriendGameActivity(friends);
  } catch {
    warnings.push("Friend activity could not be loaded.");
  }

  return (
    <main className="min-h-screen p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Game Backlog</h1>
        <Link href="/backlog" className="rounded-lg border px-4 py-2 text-sm">
          Open backlog workspace
        </Link>
      </div>

      {warnings.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-medium">Some Steam data is unavailable.</p>
          <ul className="mt-2 list-disc pl-5">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <BacklogDashboard games={sortedGames} />

      <GameSuggestion
        games={sortedGames}
        recentGames={recentGames}
        friendActivity={friendActivity}
      />

      <RecentlyPlayed games={recentGames} />

      <FriendActivity
        activity={friendActivity}
        ownedGames={sortedGames}
      />

      <GameLibrary games={sortedGames} />
    </main>
  );
}

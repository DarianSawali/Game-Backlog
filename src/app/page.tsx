import {
  getOwnedGames,
  getRecentlyPlayedGames,
  getFriendList,
} from "@/lib/steam";
import GameCard from "@/components/GameCard";
import GameLibrary from "@/components/GameLibrary";
import GameSuggestion from "@/components/GameSuggestion";
import RecentlyPlayed from "@/components/RecentlyPlayed";

import { getFriendGameActivity } from "@/lib/friends";
import FriendActivity from "@/components/FriendActivity";


export default async function Home() {
  const [games, recentGames, friends] = await Promise.all([
    getOwnedGames(),
    getRecentlyPlayedGames(),
    getFriendList(),
  ]);

  const sortedGames = [...games].sort(
    (a, b) =>
      b.playtime_forever - a.playtime_forever
  );

  const friendActivity = await getFriendGameActivity(friends);


  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">
        Game Backlog
      </h1>

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

import { getOwnedGames, getRecentlyPlayedGames } from "@/lib/steam";
import GameCard from "@/components/GameCard";
import GameLibrary from "@/components/GameLibrary";
import GameSuggestion from "@/components/GameSuggestion";
import RecentlyPlayed from "@/components/RecentlyPlayed";


export default async function Home() {
  const [games, recentGames] = await Promise.all([
    getOwnedGames(),
    getRecentlyPlayedGames(),
  ]);

  const sortedGames = [...games].sort(
    (a, b) =>
      b.playtime_forever - a.playtime_forever
  );

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">
        Game Backlog
      </h1>

      <GameSuggestion
        games={sortedGames}
        recentGames={recentGames}
      />

      <RecentlyPlayed games={recentGames} />

      <GameLibrary games={sortedGames} />
    </main>
  );
}
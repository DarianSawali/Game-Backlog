import GameMenuPreview from "@/components/GameMenuPreview";
import { getOwnedGames, getRecentlyPlayedGames } from "@/lib/steam";

export default async function Home() {
  const [gamesResult, recentResult] = await Promise.allSettled([
    getOwnedGames(),
    getRecentlyPlayedGames(),
  ]);

  return (
    <GameMenuPreview
      games={gamesResult.status === "fulfilled" ? gamesResult.value : []}
      recentGames={recentResult.status === "fulfilled" ? recentResult.value : []}
      hasError={gamesResult.status === "rejected"}
      isMainPage
    />
  );
}

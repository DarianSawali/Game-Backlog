import type { Metadata } from "next";
import GameMenuPreview from "@/components/GameMenuPreview";
import { getOwnedGames, getRecentlyPlayedGames } from "@/lib/steam";

export const metadata: Metadata = {
  title: "Game Menu Preview | Game Backlog",
  description: "A game-menu-inspired interface for a Steam backlog.",
};

export default async function GameMenuPage() {
  const [gamesResult, recentResult] = await Promise.allSettled([
    getOwnedGames(),
    getRecentlyPlayedGames(),
  ]);

  return (
    <GameMenuPreview
      games={gamesResult.status === "fulfilled" ? gamesResult.value : []}
      recentGames={recentResult.status === "fulfilled" ? recentResult.value : []}
      hasError={gamesResult.status === "rejected"}
    />
  );
}

import GameMenuPreview from "@/components/GameMenuPreview";
import LibraryStateReporter from "@/components/auth/LibraryStateReporter";
import { getLibraryAccessState } from "@/lib/auth-state";
import { getOwnedGames, getRecentlyPlayedGames } from "@/lib/steam";

export default async function Home() {
  const steamId = process.env.STEAM_ID;
  const [gamesResult, recentResult] = await Promise.allSettled([
    steamId ? getOwnedGames(steamId) : Promise.reject(new Error("STEAM_ID is missing")),
    steamId ? getRecentlyPlayedGames(steamId) : Promise.reject(new Error("STEAM_ID is missing")),
  ]);
  const libraryResult = gamesResult.status === "fulfilled"
    ? gamesResult.value
    : null;
  const games = libraryResult?.status === "available"
    ? libraryResult.games
    : [];

  return (
    <>
      <LibraryStateReporter library={getLibraryAccessState(libraryResult)} />
      <GameMenuPreview
        games={games}
        recentGames={recentResult.status === "fulfilled" ? recentResult.value : []}
        hasError={!libraryResult || libraryResult.status === "failed"}
        isMainPage
      />
    </>
  );
}

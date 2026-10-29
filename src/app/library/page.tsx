import type { Metadata } from "next";
import LibraryPageContent from "@/components/LibraryPageContent";
import LibraryStateReporter from "@/components/auth/LibraryStateReporter";
import { getLibraryAccessState, type LibraryAccessState } from "@/lib/auth-state";
import { getOwnedGames, type SteamGame } from "@/lib/steam";

export const metadata: Metadata = { title: "Library | Game Backlog" };

export default async function LibraryPage() {
  const steamId = process.env.STEAM_ID;
  let games: SteamGame[] = [];
  let library: LibraryAccessState = getLibraryAccessState(null);
  try {
    if (steamId) {
      const result = await getOwnedGames(steamId);
      library = getLibraryAccessState(result);
      if (result.status === "available") games = result.games;
    }
  } catch {}
  return <><LibraryStateReporter library={library}/><LibraryPageContent games={games}/></>;
}

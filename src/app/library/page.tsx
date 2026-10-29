import type { Metadata } from "next";
import LibraryPageContent from "@/components/LibraryPageContent";
import { getOwnedGames, type SteamGame } from "@/lib/steam";

export const metadata: Metadata = { title: "Library | Game Backlog" };

export default async function LibraryPage() {
  const steamId = process.env.STEAM_ID;
  let games: SteamGame[] = [];
  try {
    if (steamId) {
      const result = await getOwnedGames(steamId);
      if (result.status === "available") games = result.games;
    }
  } catch {}
  return <LibraryPageContent games={games}/>;
}
